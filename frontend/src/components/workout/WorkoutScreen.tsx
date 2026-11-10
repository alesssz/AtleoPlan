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
 * workout, put it in the queue of workouts to send, try to send it at once
 * (src/lib/pending-sessions.ts), and open its summary (src/pages/SummaryPage.tsx).
 *
 * Exercises can be added on the way (Add exercises, the plan editor's
 * picker): in any workout, and in a free workout (Home), which starts with
 * none and shows only that until the first is added.
 *
 * Two panels from the bottom (UI-6): the big stepper, opened by a tap on a
 * set's value (SetStepper.tsx), and the exercise's menu, behind the "⋯"
 * beside its name (ExerciseMenu.tsx): swap, skip, a note, the video. And
 * one full screen: the stopwatch of a timed set, opened by its ▶
 * (StopwatchPanel.tsx).
 */
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Dumbbell, Link2, ListPlus, Plus, X } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { Exercise } from '@/api/exercises'
import { fetchLastSets } from '@/api/sessions'
import { ExercisePicker } from '@/components/plans/editor/ExercisePicker'
import { itemSummary } from '@/components/plans/plan-format'
import { Button } from '@/components/ui/button'
import { restOver } from '@/lib/alarm'
import { useNow } from '@/lib/useNow'
import { useWakeLock } from '@/lib/useWakeLock'
import { cn } from '@/lib/utils'
import { clock } from './clock'
import { WORKOUT_COLUMN } from './layout'
import { RestBar } from './RestBar'
import { finishWorkout } from './finish-workout'
import { FinishButton } from './FinishButton'
import { storeActiveSession } from './session-storage'
import { ExerciseMenu } from './ExerciseMenu'
import { SetHeader, SetRow } from './SetRow'
import { SetStepper } from './SetStepper'
import { StopwatchPanel } from './StopwatchPanel'
import { FALLBACK_REST_SECONDS } from './useStartWorkout'
import { allSetsDone, countSets, elapsedSeconds, exerciseFrom, findSet, isForTime, restLeft, setNumbers, supersetNext, supersetOf, swappedExercise, workoutReducer, type ActiveSession, type SetField } from './workout-session'

/**
 * The one touch the two "add" buttons, Add set and Add exercises, have
 * beyond the app's outlined buttons: a lime ＋, the signal that something
 * can be added. `[&_svg]:` styles the elements inside, here the icon.
 * Otherwise they are the standard outline buttons, as Previous and Next,
 * for a coherent screen (docs/how-to/H3-frontend.md H3.20.7).
 */
const ADD_ICON = '[&_svg]:text-primary'

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
  // The big stepper: whether it is open, and on which set and field of the
  // exercise on screen. Kept apart, so the panel keeps its content while it
  // slides away
  const [stepperOpen, setStepperOpen] = useState(false)
  const [stepping, setStepping] = useState<{ set: number, field: SetField }>({ set: 0, field: 'weight' })
  // The picker of Swap exercise, opened from the exercise's menu
  const [swapOpen, setSwapOpen] = useState(false)

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
  // The exercises of its superset, in order; just itself when alone
  const superset = supersetOf(session, index)
  // Whether it is done as fast as possible: reps and seconds, the stopwatch
  const forTime = item ? isForTime(item) : false
  // The on-screen numbers of its sets: W W 1 2 3, warm-ups counted apart
  const numbers = setNumbers(item?.sets ?? [])
  // The sets that count, done and in all, for the Finish dialog
  const count = countSets(session)
  // What the two Finish buttons share: the count, busy, the action
  const finishProps = { count, disabled: finishing, onFinish: () => void finish() }
  // Time to finish: the last exercise, or nothing left to tick. The bottom
  // bar then offers Finish workout instead of Next. Never with no exercise
  // at all: a free workout just started has nothing to finish
  // In a superset, where to go on: its next exercise with a set left
  // (supersetNext); null on an exercise on its own, or a superset done.
  // The bottom bar then offers it, "Next: Lateral Raise": the screen never
  // moves by itself after a tick (H3.15.16)
  const supersetTarget = supersetNext(session, index)
  // Its name, for the button
  const supersetName = supersetTarget === null ? '' : (session.exercises[supersetTarget]?.exercise.name ?? '')
  const finishTime = supersetTarget === null && total > 0 && (index >= total - 1 || allSetsDone(session))
  // The right-hand button needs the bar's room: Finish workout, or the
  // superset's next exercise with its name
  const wide = finishTime || supersetTarget !== null
  // A free workout with no exercise yet: the screen shows only how to add one
  const empty = total === 0
  // The name of the set in the stepper: "Set 1", "Warm-up 2"
  const stepNumber = numbers[stepping.set]
  const stepName = stepNumber?.warmUp ? t('workout.warmUpName', { number: stepNumber.number }) : t('workout.setName', { number: stepNumber?.number ?? stepping.set + 1 })
  // The stopwatch running, and its set: where it is, the exercise, the
  // set's on-screen name. Looked up by the set's id: it may be on another
  // exercise than the one on screen. null when none runs
  const stopwatch = session.stopwatch ?? null
  const timed = stopwatch ? findSet(session, stopwatch.set_id) : null
  const timedItem = timed ? session.exercises[timed.exercise] : undefined
  const timedSet = timed ? timedItem?.sets[timed.set] : undefined
  const timedNumber = timed && timedItem ? setNumbers(timedItem.sets)[timed.set] : undefined
  const timedName = timedNumber?.warmUp ? t('workout.warmUpName', { number: timedNumber.number }) : t('workout.setName', { number: timedNumber?.number ?? 1 })
  // The settings an added exercise needs
  const addOptions = { unit, language: i18n.language, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS }

  /**
   * The exercises picked in the library, added at the end with last time's
   * sets (none offline), and the first of them opened.
   * @param exercises the exercises ticked, in order
   */
  async function addExercises(exercises: Exercise[]) {
    // Last time's sets of these exercises; an empty list offline
    const lastSets = await fetchLastSets(exercises.map(exercise => exercise.id)).catch(() => [])
    dispatch({ type: 'addExercises', exercises: exercises.map(exercise => exerciseFrom(exercise, lastSets, addOptions)) })
  }

  /**
   * Swap, from the exercise's menu: the exercise on screen gives its place
   * to the one picked, with that one's sets of last time (none offline).
   * @param exercise the exercise picked
   */
  async function swap(exercise: Exercise) {
    if (!item) return
    // Last time's sets of the new exercise; an empty list offline
    const lastSets = await fetchLastSets([exercise.id]).catch(() => [])
    dispatch({ type: 'swapExercise', exercise: index, replacement: swappedExercise(item, exercise, lastSets, addOptions) })
  }

  /** Cancel, on an empty free workout: nothing was done, so nothing is kept. */
  function cancel() {
    storeActiveSession(null)
    void navigate('/', { replace: true })
  }

  /** ✕: pauses the workout, keeps it on the phone, and leaves. */
  function pauseAndLeave() {
    // The paused workout, written now: after navigate() this screen is gone
    storeActiveSession(workoutReducer(session, { type: 'pause', now: new Date().toISOString() }))
    void navigate(session.plan_id ? `/plans/${session.plan_id}` : '/')
  }

  /** Finish, confirmed: finishes, queues, tries to send, and opens the summary. */
  async function finish() {
    setFinishing(true)
    // Finished, queued, sent if the network allows, kept for the summary
    // (finish-workout.ts); then the summary. `replace`: Back does not
    // return to a workout that is over
    const id = await finishWorkout(session, unit, queryClient)
    void navigate(`/session/${id}/summary`, { replace: true })
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
          {/* The day's name; a free workout has none */}
          <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-extrabold">{session.day_name ?? t('workout.free')}</h1>
          <p className="font-semibold text-muted-foreground tabular-nums">
            <span className="sr-only">{`${t('workout.clock')}: `}</span>
            {clock(elapsedSeconds(session, now))}
          </p>
          {/* Outlined: there to stop early, not the next thing to do */}
          {!empty && <FinishButton {...finishProps} label={t('workout.done')} variant="outline" className="px-4" />}
        </div>
      </header>

      {/* The middle, which scrolls, alone: the bars stay put, as in an app.
          `relative` keeps the hidden "Rest over" text (sr-only, which is
          absolutely positioned) inside it: without it, that text sat below
          the end of a long exercise and made the whole page taller than the
          screen (docs/how-to/H3-frontend.md H3.15.11) */}
      <main className="relative flex-1 overflow-y-auto py-5 sm:py-6">
        <div className={WORKOUT_COLUMN}>
          {/* A free workout with no exercise yet: what to do, and the way
              back for a workout started by mistake */}
          {empty && (
            <div className="flex flex-col items-start gap-4 py-6">
              <h2 className="font-heading text-xl font-extrabold">{t('workout.emptyTitle')}</h2>
              <p className="max-w-prose text-muted-foreground">{t('workout.emptyText')}</p>
              <div className="flex flex-wrap gap-3">
                {/* Lime: the one thing to do here */}
                <ExercisePicker
                  trigger={(
                    <Button size="xl">
                      <ListPlus aria-hidden="true" />
                      {t('workout.addExercises')}
                    </Button>
                  )}
                  onAdd={exercises => void addExercises(exercises)}
                />
                <Button variant="outline" size="xl" onClick={cancel}>{t('workout.cancel')}</Button>
              </div>
            </div>
          )}

          {/* Where we are: a dot per exercise, each a button to jump to it,
              and on the right of the row "＋ Add exercises" (the
              library's picker, as in the plan editor:
              src/components/plans/editor/ExercisePicker.tsx). The dots are
              the workout's exercises, so adding one belongs beside them:
              rare in a planned day, out of the way up here, yet
              always at hand (a free workout's first exercises come from
              the big lime button instead, above) */}
          {!empty && (
            <nav aria-label={t('workout.exerciseOf', { number: index + 1, total })} className="mb-5">
              <div className="mb-2 flex items-center gap-3">
                <ol className="flex flex-wrap gap-1.5">
                  {session.exercises.map((exercise, position) => (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        aria-label={exercise.skipped ? t('workout.jumpToSkipped', { number: position + 1, name: exercise.exercise.name }) : t('workout.jumpTo', { number: position + 1, name: exercise.exercise.name })}
                        // aria-current="step": the step being done, for screen readers
                        aria-current={position === index ? 'step' : undefined}
                        onClick={() => dispatch({ type: 'goTo', exercise: position })}
                        className={cn(
                          'size-3 rounded-full',
                          // On screen; with a set done; skipped (greyer); not yet
                          position === index ? 'bg-primary ring-2 ring-primary/40' : exercise.sets.some(set => set.done) ? 'bg-primary/60' : exercise.skipped ? 'bg-muted-foreground/30' : 'bg-muted',
                        )}
                      />
                    </li>
                  ))}
                </ol>
                {/* On the right of the row (ml-auto), with its words: a ＋
                    alone was not understood. The same outlined button as
                    Add set */}
                <ExercisePicker
                  trigger={(
                    <Button variant="outline" size="xl" className={cn('ml-auto px-4', ADD_ICON)}>
                      <Plus aria-hidden="true" />
                      {t('workout.addExercises')}
                    </Button>
                  )}
                  onAdd={exercises => void addExercises(exercises)}
                />
              </div>
              <p className="text-sm text-muted-foreground">{t('workout.exerciseOf', { number: index + 1, total })}</p>
            </nav>
          )}

          {item && (
            <section aria-labelledby="exercise-name">
              {/* The exercise: photo, name, what was planned, the plan's
                  notes, the user's own note, and its menu (⋯) on the right */}
              <div className="mb-6 flex gap-4">
                {cover
                  ? <img src={cover.url} alt="" className="size-20 shrink-0 rounded-2xl bg-muted object-cover" />
                  : <div aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-2xl bg-muted"><Dumbbell className="size-7 text-muted-foreground" /></div>}
                <div className="min-w-0 flex-1">
                  <h2 id="exercise-name" className="font-heading text-xl font-extrabold">{item.exercise.name}</h2>
                  {item.plan_item && (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {itemSummary(item.plan_item, { language: i18n.language, weightUnit: unit, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS, t })}
                    </p>
                  )}
                  {item.plan_item?.notes && <p className="mt-1 text-sm italic">{item.plan_item.notes}</p>}
                  {/* The note written from the menu, today */}
                  {item.notes && (
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{`${t('workout.yourNote')}: `}</span>
                      {item.notes}
                    </p>
                  )}
                  {/* In a superset: its exercises, in turn. It says why
                      Next, at the bottom, names another exercise */}
                  {superset.length > 1 && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Link2 aria-hidden="true" className="size-4 shrink-0" />
                      {t('workout.superset', { names: superset.map(position => session.exercises[position]?.exercise.name).join(' + ') })}
                    </p>
                  )}
                </div>
                <ExerciseMenu
                  item={item}
                  onSwap={() => setSwapOpen(true)}
                  onSkip={skipped => dispatch({ type: 'skipExercise', exercise: index, skipped })}
                  onSaveNote={notes => dispatch({ type: 'setNote', exercise: index, notes })}
                />
              </div>

              {/* Skipped: said above the sets, with the way back. The sets
                  stay, dimmed: ticking one takes the skip back too */}
              {item.skipped && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <p className="min-w-0 flex-1 basis-48 text-sm text-muted-foreground">{t('workout.skippedText')}</p>
                  <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'skipExercise', exercise: index, skipped: false })}>
                    {t('workout.unskip')}
                  </Button>
                </div>
              )}

              {/* The sets: the column titles, then a row each */}
              <SetHeader loggingType={item.exercise.logging_type} unit={unit} forTime={forTime} />
              <ol className={cn('flex flex-col gap-2 sm:gap-3', item.skipped && 'opacity-60')}>
                {item.sets.map((set, position) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    number={numbers[position] ?? { warmUp: false, number: position + 1 }}
                    loggingType={item.exercise.logging_type}
                    unit={unit}
                    forTime={forTime}
                    onToggle={() => dispatch({ type: 'toggleSet', exercise: index, set: position, now: new Date().toISOString() })}
                    onOpenStepper={(field) => {
                      setStepping({ set: position, field })
                      setStepperOpen(true)
                    }}
                    onTypeChange={setType => dispatch({ type: 'setSetType', exercise: index, set: position, setType })}
                    onStartStopwatch={() => dispatch({ type: 'startStopwatch', exercise: index, set: position, now: new Date().toISOString() })}
                  />
                ))}
              </ol>
              {/* The big stepper of the set tapped, one for the screen */}
              <SetStepper
                open={stepperOpen}
                onOpenChange={setStepperOpen}
                set={item.sets[stepping.set]}
                name={stepName}
                exerciseName={item.exercise.name}
                loggingType={item.exercise.logging_type}
                forTime={forTime}
                unit={unit}
                weightStep={user?.weight_step}
                focus={stepping.field}
                onChange={(field, value) => dispatch({ type: 'setField', exercise: index, set: stepping.set, field, value })}
              />
              {/* Swap exercise's picker: opened by the menu, one tap picks */}
              <ExercisePicker open={swapOpen} onOpenChange={setSwapOpen} replacing={item.exercise} onAdd={exercises => void (exercises[0] && swap(exercises[0]))} />
              {/* Add set: the row closing the table, as in D1.4.9's
                  drawing, for the set more than planned (a good day, a
                  back-off set). An outlined button as wide as the rows, as
                  the app's other secondary actions, with a lime ＋.
                  The new set copies the last one's values */}
              <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'addSet', exercise: index })} className={cn('mt-2 w-full sm:mt-3', ADD_ICON)}>
                <Plus aria-hidden="true" />
                {t('plans.editor.addSet')}
              </Button>
            </section>
          )}

          {/* Read out when it changes: "Rest over" */}
          <p aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </main>

      {/* The stopwatch of a timed set, full screen, while it runs. Last
          time's time as the clock shows it, "1:31". Done as fast as
          possible, it is a race: the target is a time to beat, and the
          reps to do are named under the set */}
      {stopwatch && timedItem && timedSet && (
        <StopwatchPanel
          stopwatch={stopwatch}
          exerciseName={timedItem.exercise.name}
          setName={timedName}
          race={isForTime(timedItem) ? { reps: Number(timedSet.reps) || null } : null}
          lastText={timedSet.last?.duration_seconds ? clock(timedSet.last.duration_seconds) : null}
          alarm={{ sound: user?.timer_sound ?? true, vibration: user?.timer_vibration ?? true }}
          onStop={() => dispatch({ type: 'stopStopwatch', now: new Date().toISOString() })}
          onCancel={() => dispatch({ type: 'cancelStopwatch' })}
        />
      )}

      {/* The rest timer, while it runs */}
      {session.rest !== null && (
        <RestBar
          left={left}
          total={session.rest.total}
          onAdjust={seconds => dispatch({ type: 'adjustRest', seconds })}
          onSkip={() => dispatch({ type: 'endRest' })}
        />
      )}

      {/* Previous and Next; not on an empty free workout, with nowhere to go */}
      {!empty && (
        <footer className="border-t pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className={cn(WORKOUT_COLUMN, 'flex justify-between gap-2')}>
            {/* Previous and Next are outlined, as the app's other actions that
              are not the main one; lime is kept for Finish workout.
              Previous: on a phone, when Finish workout needs the room, an
              arrow alone: its word is hidden below 640 px only
              (max-sm:sr-only), and screen readers still hear it */}
            <Button variant="outline" size="xl" className={cn('px-4', wide && 'max-sm:px-3.5')} disabled={index === 0} onClick={() => dispatch({ type: 'goTo', exercise: index - 1 })}>
              <ChevronLeft aria-hidden="true" />
              <span className={cn(wide && 'max-sm:sr-only')}>{t('workout.previous')}</span>
            </Button>
            {/* In a superset, its next exercise by name, with a lime border:
                where the round goes on. Otherwise Next, or, when it is
                time, Finish workout. The wide ones go across the bar on a
                phone (flex-1), their own width from 640 px (sm:flex-none),
                where a button as wide as a laptop's window would be absurd;
                a long name is cut with "…" (truncate) */}
            {supersetTarget !== null
              ? (
                  <Button variant="outline" size="xl" className="min-w-0 flex-1 border-primary/70 px-4 sm:flex-none" onClick={() => dispatch({ type: 'goTo', exercise: supersetTarget })}>
                    <span className="truncate">{t('workout.nextIn', { name: supersetName })}</span>
                    <ChevronRight aria-hidden="true" />
                  </Button>
                )
              : finishTime
                ? <FinishButton {...finishProps} label={t('workout.finishWorkout')} className="min-w-0 flex-1 sm:flex-none" />
                : (
                    <Button variant="outline" size="xl" className="px-4" onClick={() => dispatch({ type: 'goTo', exercise: index + 1 })}>
                      {t('workout.next')}
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  )}
          </div>
        </footer>
      )}
    </div>
  )
}
