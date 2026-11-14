/*
 * The summary of a workout just finished (route `/session/:id/summary`): what
 * was done (time, exercises, sets, reps), each exercise against last time ("3
 * better · 1 same", compare.ts), and two questions, how it felt (1 to 5) and
 * notes. **Save** sends them and opens Home; **Delete workout** throws the
 * workout away.
 *
 * Finish in workout mode opens it (WorkoutScreen.finish()), after putting
 * the workout in the queue of workouts to send and keeping it on the phone
 * as "finished" (session-storage.ts, FinishedWorkout). Everything is worked
 * out from that copy, with no request: the numbers (inputTotals, totals.ts)
 * and the comparison, against last time's sets that workout mode read when
 * the workout started (`previous` of each exercise). The summary works
 * offline, right after the last set.
 *
 * Opened again later (a reload after Save, another device), the address
 * has no finished workout on this phone: the workout's page in history
 * opens instead, which reads it from the server.
 */
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { homeKeys } from '@/api/home'
import { deleteSession, sessionKeys, type LastSets, type SessionExercise } from '@/api/sessions'
import { FormBanner } from '@/components/FormBanner'
import { compareWorkout, countVerdicts } from '@/components/history/compare'
import { ComparisonSummary } from '@/components/history/ComparisonSummary'
import { FeelingPicker } from '@/components/history/FeelingPicker'
import { SessionExercises } from '@/components/history/SessionExercises'
import { inputTotals } from '@/components/history/totals'
import { WorkoutStats } from '@/components/history/WorkoutStats'
import { PageHeader } from '@/components/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addPending, loadFinished, loadPending, removePending, storeFinished, type FinishedWorkout, type WorkoutOutcome } from '@/components/workout/session-storage'
import { ApiError } from '@/lib/http'
import { sendPendingSessions } from '@/lib/pending-sessions'

/** The longest notes the backend takes (SaveSessionRequest: max:2000). */
const NOTES_MAX = 2000

/**
 * What Home is told after the summary, through the navigation's state:
 * what happened to the workout. Home shows it as a banner.
 */
export interface WorkoutEndState {
  /** Saved on the server; waiting for the network; refused by the server; deleted. */
  workout: WorkoutOutcome | 'deleted'
}

/**
 * The finished workout's exercises in the shape history uses
 * (SessionExercise), so both draw them with the same component: the sets
 * sent (the ticked ones), each with its exercise from the workout. Weights
 * become text, as the API sends them.
 */
function finishedExercises(finished: FinishedWorkout): SessionExercise[] {
  return finished.input.exercises.flatMap((sent) => {
    const item = finished.session.exercises.find(candidate => candidate.id === sent.id)
    if (!item) return []
    return [{
      id: sent.id,
      exercise_id: sent.exercise_id,
      plan_item_id: sent.plan_item_id,
      superset_group: sent.superset_group,
      notes: sent.notes,
      exercise: item.exercise,
      sets: sent.sets.map(set => ({ ...set, weight_kg: set.weight_kg === null ? null : String(set.weight_kg) })),
    }]
  })
}

/**
 * Last time's sets of each exercise, as workout mode read them at the start
 * (`previous`), in the shape of GET /api/sessions/last-sets.
 */
function finishedLastSets(finished: FinishedWorkout): Pick<LastSets, 'exercise_id' | 'sets'>[] {
  return finished.session.exercises.map(item => ({ exercise_id: item.exercise.id, sets: item.previous ?? [] }))
}

export function SummaryPage() {
  const { id } = useParams()
  const [finished] = useState(loadFinished)

  // Not on this phone, or another workout: its page in history instead
  if (finished === null || finished.id !== id) return <Navigate to={`/progress/history/${id ?? ''}`} replace />

  return <Summary finished={finished} />
}

interface SummaryProps {
  /** The workout just finished, its body and what happened when it was sent. */
  finished: FinishedWorkout
}

function Summary({ finished }: SummaryProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const unit = user?.weight_unit ?? 'kg'
  const { id, input, outcome } = finished
  // No request, here and below: it works offline
  const totals = inputTotals(input)
  const exercises = finishedExercises(finished)
  const comparisons = compareWorkout(exercises, finishedLastSets(finished))
  const [feeling, setFeeling] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  // Both buttons wait; the spinner goes on the one pressed
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null)
  const [deleteFailed, setDeleteFailed] = useState(false)

  /**
   * Leaves the summary for Home, saying what happened to the workout.
   * Every list of workouts, and Home, are read again first.
   */
  function leave(workout: WorkoutEndState['workout']) {
    storeFinished(null)
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    void queryClient.invalidateQueries({ queryKey: homeKeys.all })
    void navigate('/', { replace: true, state: { workout } satisfies WorkoutEndState })
  }

  /**
   * Save: the feeling and the notes go with the workout. The whole workout is
   * sent again (PUT replaces it), through the queue, so that offline they wait
   * with it. Nothing to add: nothing to send.
   */
  async function save() {
    const written = notes.trim() === '' ? null : notes.trim()
    if (feeling === null && written === null) {
      leave(outcome)
      return
    }
    setBusy('save')
    addPending(id, { ...input, feeling, notes: written })
    const report = await sendPendingSessions()
    leave(report.sent.includes(id) ? 'saved' : report.refused.some(entry => entry.id === id) ? 'refused' : 'queued')
  }

  /**
   * Delete: the workout leaves the queue, and the server when it is there.
   * A workout still in the queue that cannot be deleted now (no network)
   * never reached the server, so leaving the queue is enough. One already
   * sent must be deleted on the server: without network, say so and stay.
   */
  async function remove() {
    setBusy('delete')
    setDeleteFailed(false)
    const wasPending = id in loadPending()
    removePending(id)
    try {
      await deleteSession(id)
    }
    catch (error) {
      // 404: not on the server (never arrived); 410: deleted already
      const gone = error instanceof ApiError && [404, 410].includes(error.status)
      if (!gone && !wasPending) {
        setBusy(null)
        setDeleteFailed(true)
        return
      }
    }
    queryClient.removeQueries({ queryKey: ['sessions', 'detail', id] })
    leave('deleted')
  }

  return (
    <>
      {/* The tab bar alone would not say what this page is */}
      <PageHeader eyebrow={t('summary.eyebrow')} title={input.day_name ?? t('workout.free')} description={input.plan_name ?? undefined} />

      <div className="flex flex-col gap-8">
        {outcome === 'queued' && <FormBanner variant="success">{t('workout.queued')}</FormBanner>}
        {outcome === 'refused' && <FormBanner variant="error">{t('workout.refused')}</FormBanner>}

        <section aria-labelledby="summary-numbers" className="flex flex-col gap-4">
          <h2 id="summary-numbers" className="sr-only">{t('summary.numbersTitle')}</h2>
          <WorkoutStats totals={totals} />
          <ComparisonSummary count={countVerdicts(comparisons)} />
          {/* Closed at first: the line above says how it went, and the
              detail must not push the questions and Save down the page */}
          <Collapsible className="group rounded-2xl border bg-card/60">
            <CollapsibleTrigger asChild>
              <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-heading text-lg font-extrabold tracking-tight hover:bg-muted/60">
                <span>
                  {t('history.exercisesTitle')}
                  {/* The space is text, not a margin: without it, the
                      button's name was "Exercises3" */}
                  {' '}
                  <span className="ml-1 text-sm font-semibold text-muted-foreground tabular-nums">{exercises.length}</span>
                </span>
                <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-has-data-open:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pt-1 pb-4">
                <SessionExercises exercises={exercises} comparisons={comparisons} unit={unit} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <FeelingPicker value={feeling} onChange={setFeeling} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="summary-notes" className="font-heading text-lg font-extrabold tracking-tight">{t('summary.notesLabel')}</Label>
          <Textarea
            id="summary-notes"
            value={notes}
            maxLength={NOTES_MAX}
            rows={4}
            placeholder={t('summary.notesPlaceholder')}
            onChange={event => setNotes(event.target.value)}
          />
        </div>

        {deleteFailed && <FormBanner variant="error">{t('summary.deleteError')}</FormBanner>}

        <div className="flex flex-wrap items-center gap-3">
          <Button size="xl" className="px-6" disabled={busy !== null} pending={busy === 'save'} onClick={() => void save()}>
            <Save aria-hidden="true" />
            {t('summary.save')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="xl" disabled={busy !== null} pending={busy === 'delete'} className="text-destructive">
                <Trash2 aria-hidden="true" />
                {t('summary.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('summary.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('summary.deleteText')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('summary.keep')}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void remove()}>{t('summary.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  )
}
