/*
 * Workout mode (docs/design/D1-ui.md D1.4.9), full screen: the day's name and
 * the time trained at the top, then one exercise at a time with its sets,
 * the rest timer at the bottom when it runs, and Previous and Next. How it
 * works: docs/concepts/C1-frontend.md C1.17.
 *
 * The workout is held with useReducer and workoutReducer
 * (workout-session.ts), and written to the phone after every change
 * (session-storage.ts): closing the app loses nothing, and ✕ only pauses.
 * Finishing has two buttons, and only one is lime at a time: Finish at the
 * top, outlined, to stop early at any moment; and Finish workout at the
 * bottom, the width of the bar, in place of Next on the last exercise or
 * once every set is ticked. Both ask for a confirmation, then finish the
 * workout, put it in the queue of workouts to send, and try to send it at
 * once (src/lib/pending-sessions.ts).
 */
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Dumbbell, Plus, X } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { sessionKeys } from '@/api/sessions'
import { itemSummary } from '@/components/plans/plan-format'
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
import { restOver } from '@/lib/alarm'
import { sendPendingSessions } from '@/lib/pending-sessions'
import { useNow } from '@/lib/useNow'
import { useWakeLock } from '@/lib/useWakeLock'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'
import { RestBar } from './RestBar'
import { addPending, storeActiveSession } from './session-storage'
import { SetHeader, SetRow } from './SetRow'
import { allSetsDone, countSets, elapsedSeconds, restLeft, setNumbers, toSessionInput, workoutReducer, type ActiveSession, type SetCount } from './workout-session'

/** What the plan's page is told after Finish, through the navigation's state. */
export interface WorkoutEndState {
  /** Saved on the server; waiting for the network; refused by the server. */
  workout: 'saved' | 'queued' | 'refused'
}

/** The user's rest when the user is not loaded yet: the backend's default. */
const FALLBACK_REST_SECONDS = 90

/** Props of WorkoutScreen. */
interface WorkoutScreenProps {
  /** The workout, as kept on the phone. */
  initial: ActiveSession
}

/** The workout in progress. */
export function WorkoutScreen({ initial }: WorkoutScreenProps) {
  // t() translates a key; i18n.language is the interface's language
  const { t, i18n } = useTranslation()
  // A function that opens another page
  const navigate = useNavigate()
  // TanStack Query's cache, to have the lists of workouts read again
  const queryClient = useQueryClient()
  // The signed-in user: unit, default rest, sound and vibration
  const { data: user } = useCurrentUser()
  // The weight unit the fields are in
  const unit = user?.weight_unit ?? 'kg'
  // The workout; dispatch(action) asks workoutReducer for the next one
  const [session, dispatch] = useReducer(workoutReducer, initial)
  // The current moment, every second: the clock and the rest timer
  const now = useNow(1000)
  // Shown for a few seconds when a rest ends, and read out (aria-live)
  const [announce, setAnnounce] = useState('')
  // True while Finish is sending
  const [finishing, setFinishing] = useState(false)

  // The screen stays on (Wake Lock API) for the whole workout
  useWakeLock(true)

  // Opening a paused workout starts its clock again. Once, on the first
  // draw: the empty list of dependencies
  useEffect(() => {
    dispatch({ type: 'resume', now: new Date().toISOString() })
  }, [])

  // Every change is written to the phone
  useEffect(() => {
    storeActiveSession(session)
  }, [session])

  // The end of the rest: a timer set for the moment it ends. When it fires,
  // a vibration and a beep, as the user wants, a message read out, and the
  // timer cleared. A new rest (or ±15 s) sets a new timer: the clean-up
  // clears the old one. The state changes in the timer's function, not in
  // the effect itself, which React's rules ask for
  useEffect(() => {
    if (session.rest === null) return
    // Milliseconds until the end; 0 when it is already past
    const delay = Math.max(0, Date.parse(session.rest.ends_at) - Date.now())
    const timer = setTimeout(() => {
      restOver({ sound: user?.timer_sound ?? true, vibration: user?.timer_vibration ?? true })
      setAnnounce(t('workout.restOver'))
      dispatch({ type: 'endRest' })
    }, delay)
    return () => clearTimeout(timer)
  }, [session.rest, t, user])

  // The seconds of rest left, for the bar
  const left = restLeft(session, now)

  // The exercise on screen
  const index = session.current
  const item = session.exercises[index]
  const total = session.exercises.length
  const cover = item?.exercise.photos[0]
  // The on-screen numbers of its sets: W W 1 2 3, warm-ups counted apart
  const numbers = setNumbers(item?.sets ?? [])
  // The sets that count, done and in all, for the Finish dialog
  const count = countSets(session)
  // What the two Finish buttons share: the count, busy, the action
  const finishProps = { count, disabled: finishing, onFinish: () => void finish() }
  // Time to finish: the last exercise, or nothing left to tick. The bottom
  // bar then offers Finish workout instead of Next
  const finishTime = index >= total - 1 || allSetsDone(session)

  /** ✕: pauses the workout, keeps it on the phone, and leaves. */
  function pauseAndLeave() {
    // The paused workout, written now: after navigate() this screen is gone
    storeActiveSession(workoutReducer(session, { type: 'pause', now: new Date().toISOString() }))
    void navigate(session.plan_id ? `/plans/${session.plan_id}` : '/')
  }

  /** Finish, confirmed: finishes, queues, tries to send, and opens the plan's page. */
  async function finish() {
    setFinishing(true)
    // The finished workout and its body; queued first, so nothing is lost
    // whatever happens to the request
    const finished = workoutReducer(session, { type: 'finish', now: new Date().toISOString() })
    addPending(finished.id, toSessionInput(finished, unit, new Date()))
    storeActiveSession(null)
    // What happened to every queued workout, this one included
    const report = await sendPendingSessions()
    // The lists that show workouts are read again
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all })
    // What happened to this workout, for the plan's page
    const outcome: WorkoutEndState['workout'] = report.sent.includes(finished.id)
      ? 'saved'
      : report.refused.some(entry => entry.id === finished.id) ? 'refused' : 'queued'
    void navigate(finished.plan_id ? `/plans/${finished.plan_id}` : '/', { replace: true, state: { workout: outcome } satisfies WorkoutEndState })
  }

  return (
    // The whole screen: a column whose middle scrolls, header and footer fixed
    <div className="flex h-dvh flex-col bg-background">
      {/* The top: ✕, the day, the time trained, Finish */}
      <header className="border-b pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-4">
        <div className={cn(WORKOUT_COLUMN, 'flex items-center gap-2')}>
          <Button variant="ghost" size="icon-xl" aria-label={t('workout.close')} onClick={pauseAndLeave}>
            <X aria-hidden="true" />
          </Button>
          <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-extrabold">{session.day_name}</h1>
          <p className="font-semibold text-muted-foreground tabular-nums">
            <span className="sr-only">{`${t('workout.clock')}: `}</span>
            {clock(elapsedSeconds(session, now))}
          </p>
          {/* Outlined: there to stop early, not the next thing to do */}
          <FinishButton {...finishProps} label={t('workout.done')} variant="outline" className="px-4" />
        </div>
      </header>

      {/* The middle, which scrolls, alone: the bars stay put, as in an app.
          `relative` keeps the hidden "Rest over" text (sr-only, which is
          absolutely positioned) inside it: without it, that text sat below
          the end of a long exercise and made the whole page taller than the
          screen (docs/how-to/H3-frontend.md H3.15.11) */}
      <main className="relative flex-1 overflow-y-auto py-5 sm:py-6">
        <div className={WORKOUT_COLUMN}>
          {/* Where we are: a dot per exercise, each a button to jump to it */}
          <nav aria-label={t('workout.exerciseOf', { number: index + 1, total })} className="mb-5">
            <ol className="mb-2 flex flex-wrap gap-1.5">
              {session.exercises.map((exercise, position) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    aria-label={t('workout.jumpTo', { number: position + 1, name: exercise.exercise.name })}
                    // aria-current="step": the step being done, for screen readers
                    aria-current={position === index ? 'step' : undefined}
                    onClick={() => dispatch({ type: 'goTo', exercise: position })}
                    className={cn(
                      'size-3 rounded-full',
                      position === index ? 'bg-primary ring-2 ring-primary/40' : exercise.sets.some(set => set.done) ? 'bg-primary/60' : 'bg-muted',
                    )}
                  />
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">{t('workout.exerciseOf', { number: index + 1, total })}</p>
          </nav>

          {item && (
            <section aria-labelledby="exercise-name">
              {/* The exercise: photo, name, what was planned, the plan's notes */}
              <div className="mb-6 flex gap-4">
                {cover
                  ? <img src={cover.url} alt="" className="size-20 shrink-0 rounded-2xl bg-muted object-cover" />
                  : <div aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-2xl bg-muted"><Dumbbell className="size-7 text-muted-foreground" /></div>}
                <div className="min-w-0">
                  <h2 id="exercise-name" className="font-heading text-xl font-extrabold">{item.exercise.name}</h2>
                  {item.plan_item && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {itemSummary(item.plan_item, { language: i18n.language, weightUnit: unit, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS, t })}
                    </p>
                  )}
                  {item.plan_item?.notes && <p className="mt-1 text-sm italic">{item.plan_item.notes}</p>}
                </div>
              </div>

              {/* The sets: the column titles, then a row each */}
              <SetHeader loggingType={item.exercise.logging_type} unit={unit} />
              <ol className="flex flex-col gap-2 sm:gap-3">
                {item.sets.map((set, position) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    number={numbers[position] ?? { warmUp: false, number: position + 1 }}
                    loggingType={item.exercise.logging_type}
                    unit={unit}
                    onToggle={() => dispatch({ type: 'toggleSet', exercise: index, set: position, now: new Date().toISOString() })}
                    onChange={(field, value) => dispatch({ type: 'setField', exercise: index, set: position, field, value })}
                    onCycleType={() => dispatch({ type: 'cycleSetType', exercise: index, set: position })}
                  />
                ))}
              </ol>
              {/* Outlined and 48 px tall, like the plan editor's Add set */}
              <Button variant="outline" size="xl" className="mt-4" onClick={() => dispatch({ type: 'addSet', exercise: index })}>
                <Plus aria-hidden="true" />
                {t('plans.editor.addSet')}
              </Button>
            </section>
          )}

          {/* Read out when it changes: "Rest over" */}
          <p aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </main>

      {/* The rest timer, while it runs */}
      {session.rest !== null && (
        <RestBar
          left={left}
          total={session.rest.total}
          onAdjust={seconds => dispatch({ type: 'adjustRest', seconds })}
          onSkip={() => dispatch({ type: 'endRest' })}
        />
      )}

      {/* Previous and Next */}
      <footer className="border-t pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className={cn(WORKOUT_COLUMN, 'flex justify-between gap-2')}>
          {/* Previous and Next are outlined, as the app's other actions that
              are not the main one; lime is kept for Finish workout.
              Previous: on a phone, when Finish workout needs the room, an
              arrow alone: its word is hidden below 640 px only
              (max-sm:sr-only), and screen readers still hear it */}
          <Button variant="outline" size="xl" className={cn('px-4', finishTime && 'max-sm:px-3.5')} disabled={index === 0} onClick={() => dispatch({ type: 'goTo', exercise: index - 1 })}>
            <ChevronLeft aria-hidden="true" />
            <span className={cn(finishTime && 'max-sm:sr-only')}>{t('workout.previous')}</span>
          </Button>
          {/* Next, or, when it is time, Finish workout: across the bar on a
              phone (flex-1), its own width from 640 px (sm:flex-none), where
              a button as wide as a laptop's window would be absurd */}
          {finishTime
            ? <FinishButton {...finishProps} label={t('workout.finishWorkout')} className="min-w-0 flex-1 sm:flex-none" />
            : (
                <Button variant="outline" size="xl" className="px-4" onClick={() => dispatch({ type: 'goTo', exercise: index + 1 })}>
                  {t('workout.next')}
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
        </div>
      </footer>
    </div>
  )
}

/** Props of FinishButton. */
interface FinishButtonProps {
  /** The sets that count, done and in all, for the question. */
  count: SetCount
  /** The button's text: "Finish" at the top, "Finish workout" at the bottom. */
  label: string
  /** The button's look: lime (default) or outlined. */
  variant?: 'default' | 'outline'
  /** Extra classes for the button: its padding or width. */
  className?: string
  /** True while finishing. */
  disabled: boolean
  /** Called when the user confirms. */
  onFinish: () => void
}

/**
 * Finish, with a confirmation: finishing cannot be undone from here. The
 * question says how many sets were done, and, when finishing early, that
 * the sets not ticked will not be saved.
 */
function FinishButton({ count, label, variant = 'default', className, disabled, onFinish }: FinishButtonProps) {
  const { t } = useTranslation()
  // The sets not ticked, warm-ups excluded
  const left = count.total - count.done

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="xl" variant={variant} className={className} disabled={disabled}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('workout.finishTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('workout.finishText', { count: count.done, total: count.total })}
            {left > 0 && ` ${t('workout.finishLeft', { count: left })}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('workout.keepGoing')}</AlertDialogCancel>
          <AlertDialogAction onClick={onFinish}>{t('workout.finishConfirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
