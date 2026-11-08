/*
 * The summary of a workout just finished (route `/session/:id/summary`,
 * docs/design/D1-ui.md D1.4.10): what was done (time, exercises, sets,
 * reps), each exercise against last time ("3 better · 1 same", compare.ts),
 * and two questions, how it felt (1 to 5) and notes. **Save** sends them and
 * opens Home; **Delete workout** throws the workout away.
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
 *
 * How it works: docs/concepts/C1-frontend.md C1.19; how it was built:
 * docs/how-to/H3-frontend.md H3.17.
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
 * @param finished the workout just finished
 */
function finishedExercises(finished: FinishedWorkout): SessionExercise[] {
  return finished.input.exercises.flatMap((sent) => {
    // The workout's own exercise, for its name, photo and logging type
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
 * @param finished the workout just finished
 */
function finishedLastSets(finished: FinishedWorkout): Pick<LastSets, 'exercise_id' | 'sets'>[] {
  return finished.session.exercises.map(item => ({ exercise_id: item.exercise.id, sets: item.previous ?? [] }))
}

/** The summary page (route `/session/:id/summary`). */
export function SummaryPage() {
  // The :id of the address
  const { id } = useParams()
  // The workout just finished, kept on the phone, read once
  const [finished] = useState(loadFinished)

  // Not on this phone, or another workout: its page in history instead.
  // <Navigate> changes the address as soon as it is drawn; `replace`: Back
  // does not return here
  if (finished === null || finished.id !== id) return <Navigate to={`/progress/history/${id ?? ''}`} replace />

  return <Summary finished={finished} />
}

/** Props of Summary. */
interface SummaryProps {
  /** The workout just finished, its body and what happened when it was sent. */
  finished: FinishedWorkout
}

/** The summary's content, once the finished workout is known. */
function Summary({ finished }: SummaryProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const unit = user?.weight_unit ?? 'kg'
  const { id, input, outcome } = finished
  // The four numbers, from the body sent: no request
  const totals = inputTotals(input)
  // The exercises, and each against last time: no request either
  const exercises = finishedExercises(finished)
  const comparisons = compareWorkout(exercises, finishedLastSets(finished))
  // The two answers, held while the user writes
  const [feeling, setFeeling] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  // True while Save or Delete runs; the error of a Delete that failed
  const [busy, setBusy] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  /**
   * Leaves the summary for Home, saying what happened to the workout.
   * Every list of workouts, and Home, are read again first.
   * @param workout what happened
   */
  function leave(workout: WorkoutEndState['workout']) {
    storeFinished(null)
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    void queryClient.invalidateQueries({ queryKey: homeKeys.all })
    void navigate('/', { replace: true, state: { workout } satisfies WorkoutEndState })
  }

  /**
   * Save: the feeling and the notes go with the workout. The whole workout
   * is sent again (PUT replaces it, C2.5.7), through the queue, so that
   * offline they wait with it. Nothing to add: nothing to send.
   */
  async function save() {
    // The notes without spaces around them; null when empty
    const written = notes.trim() === '' ? null : notes.trim()
    if (feeling === null && written === null) {
      leave(outcome)
      return
    }
    setBusy(true)
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
    setBusy(true)
    setDeleteFailed(false)
    // Whether it was still waiting to be sent, before taking it off
    const wasPending = id in loadPending()
    removePending(id)
    try {
      await deleteSession(id)
    }
    catch (error) {
      // 404: not on the server (never arrived); 410: deleted already
      const gone = error instanceof ApiError && [404, 410].includes(error.status)
      if (!gone && !wasPending) {
        setBusy(false)
        setDeleteFailed(true)
        return
      }
    }
    queryClient.removeQueries({ queryKey: ['sessions', 'detail', id] })
    leave('deleted')
  }

  return (
    <>
      <PageHeader eyebrow={t('summary.eyebrow')} title={input.day_name ?? t('workout.free')} description={input.plan_name ?? undefined} />

      <div className="flex flex-col gap-8">
        {/* What happened when it was sent at Finish */}
        {outcome === 'queued' && <FormBanner variant="success">{t('workout.queued')}</FormBanner>}
        {outcome === 'refused' && <FormBanner variant="error">{t('workout.refused')}</FormBanner>}

        {/* The numbers, the workout against last time in one line, and
            the exercises behind a disclosure, all above the questions */}
        <section aria-labelledby="summary-numbers" className="flex flex-col gap-4">
          <h2 id="summary-numbers" className="sr-only">{t('summary.numbersTitle')}</h2>
          <WorkoutStats totals={totals} />
          <ComparisonSummary count={countVerdicts(comparisons)} />
          {/* Each exercise against last time, with its sets, closed at
              first: the line above says how it went, and the list is
              there for whoever wants the detail, without pushing the
              questions and Save down the page. A Collapsible
              (src/components/ui/collapsible.tsx): Radix keeps it open or
              closed, tells screen readers (aria-expanded), and the list
              slides in and out. `group` on the frame lets the arrow turn
              when it is open: the trigger carries data-state="open", read
              with group-has-data-open: */}
          <Collapsible className="group rounded-2xl border bg-card/60">
            {/* asChild: the trigger is our own <button>, full width, 48 px
                tall at least, with the title, the count and the arrow */}
            <CollapsibleTrigger asChild>
              <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-heading text-lg font-extrabold tracking-tight hover:bg-muted/60">
                <span>
                  {t('history.exercisesTitle')}
                  {/* How many, quietly, after the title. The space is
                      text, not only a margin: without it, the button's
                      name for screen readers was "Exercises3" */}
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

        {/* How it felt, from 1 to 5 */}
        <FeelingPicker value={feeling} onChange={setFeeling} />

        {/* Free notes. The label names the field for screen readers too */}
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

        {/* Save, lime: the one main action. Delete, red and outlined,
            with a question first: it cannot be undone */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xl" className="px-6" disabled={busy} onClick={() => void save()}>
            <Save aria-hidden="true" />
            {t('summary.save')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="xl" disabled={busy} className="text-destructive">
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
