/*
 * Workout mode, full screen: the day's name and the time trained at the top,
 * then one exercise at a time with its sets, the rest timer at the bottom when
 * it runs, and Previous and Next.
 *
 * The workout is written to the phone after every change
 * (session-storage.ts): closing the app loses nothing, and ✕ only pauses.
 * Finishing has two buttons, and only one is lime at a time: Finish at the
 * top, outlined, to stop early at any moment; and Finish workout at the
 * bottom, the width of the bar, in place of Next on the last exercise or
 * once every set is ticked. Both ask for a confirmation, then finish the
 * workout, put it in the queue of workouts to send, try to send it at once
 * (src/lib/pending-sessions.ts), and open its summary (src/pages/SummaryPage.tsx).
 * Their dialog also offers Delete workout, which throws the workout away
 * without finishing it, after a second question (FinishButton.tsx).
 *
 * Exercises can be added on the way (Add exercises, the plan editor's
 * picker): in any workout, and in a free workout (Home), which starts with
 * none and shows only that until the first is added. What is added by hand
 * can be removed again, and only that: an exercise from its menu, a set
 * from its stepper (canRemoveExercise, canRemoveSet in workout-session.ts).
 * The plan's exercises and sets stay; they can be skipped or left unticked.
 *
 * Three panels from the bottom: the big stepper, opened by a tap on a set's
 * value (SetStepper.tsx), and the exercise's menu, behind the "⋯" beside its
 * name (ExerciseMenu.tsx): swap, skip, a note, the video; and "How to do it",
 * opened by a tap on the exercise's photo or name (ExerciseInfoSheet.tsx): its
 * photos, muscles and steps. The stopwatch of a timed set, opened by its ▶, is
 * docked at the bottom where the rest bar goes (StopwatchPanel.tsx), so the
 * sets stay in sight. Under the sets, the "Up next" card names the exercise
 * that follows (UpNextCard.tsx), as does the rest bar once the exercise on
 * screen is done.
 */
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Dumbbell, Info, Link2, ListPlus, Plus, X } from 'lucide-react'
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
import { ExerciseInfoSheet } from './ExerciseInfoSheet'
import { ExerciseMenu } from './ExerciseMenu'
import { SetHeader, SetRow } from './SetRow'
import { SetStepper } from './SetStepper'
import { StopwatchPanel } from './StopwatchPanel'
import { UpNextCard } from './UpNextCard'
import { FALLBACK_REST_SECONDS } from './useStartWorkout'
import { allSetsDone, countSets, elapsedSeconds, exerciseFrom, canRemoveExercise, canRemoveSet, findSet, hasWorkLeft, isForTime, restLeft, setNumbers, supersetNext, supersetOf, swappedExercise, upNext, workoutReducer, type ActiveSession, type SetField, type WorkoutExercise } from './workout-session'

/**
 * Add set and Add exercises are standard outline buttons, as Previous and Next,
 * with one touch: a lime ＋, the signal that something can be added.
 */
const ADD_ICON = '[&_svg]:text-primary'

interface WorkoutScreenProps {
  initial: ActiveSession
}

export function WorkoutScreen({ initial }: WorkoutScreenProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const unit = user?.weight_unit ?? 'kg'
  const [session, dispatch] = useReducer(workoutReducer, initial)
  const now = useNow(1000)
  // Shown for a few seconds when a rest ends, and read out (aria-live)
  const [announce, setAnnounce] = useState('')
  const [finishing, setFinishing] = useState(false)
  // Kept apart from `open`, so the panel keeps its content while it slides away
  const [stepperOpen, setStepperOpen] = useState(false)
  const [stepping, setStepping] = useState<{ set: number, field: SetField }>({ set: 0, field: 'weight' })
  const [swapOpen, setSwapOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  useWakeLock(true)

  // Opening a paused workout starts its clock again
  useEffect(() => {
    dispatch({ type: 'resume', now: new Date().toISOString() })
  }, [])

  useEffect(() => {
    storeActiveSession(session)
  }, [session])

  // A timer for the moment the rest ends: the signal, a message read out,
  // and the rest cleared. A new rest (or ±15 s) replaces it
  useEffect(() => {
    if (session.rest === null) return
    const delay = Math.max(0, Date.parse(session.rest.ends_at) - Date.now())
    const timer = setTimeout(() => {
      restOver({ sound: user?.timer_sound ?? true, vibration: user?.timer_vibration ?? true })
      setAnnounce(t('workout.restOver'))
      dispatch({ type: 'endRest' })
    }, delay)
    return () => clearTimeout(timer)
  }, [session.rest, t, user])

  const left = restLeft(session, now)

  const index = session.current
  const item = session.exercises[index]
  const total = session.exercises.length
  const cover = item?.exercise.photos[0]
  const superset = supersetOf(session, index)
  const forTime = item ? isForTime(item) : false
  // W W 1 2 3: warm-ups counted apart
  const numbers = setNumbers(item?.sets ?? [])
  const count = countSets(session)
  const finishProps = { count, disabled: finishing, onFinish: () => void finish(), onDiscard: discard }
  // Time to finish: the last exercise, or nothing left to tick. The bottom bar
  // then offers Finish workout instead of Next. Never with no exercise at all:
  // a free workout just started has nothing to finish In a superset, where to
  // go on: its next exercise with a set left (supersetNext); null on an
  // exercise on its own, or a superset done. The bottom bar then offers it,
  // "Next: Lateral Raise": the screen never moves by itself after a tick
  const supersetTarget = supersetNext(session, index)
  const supersetName = supersetTarget === null ? '' : (session.exercises[supersetTarget]?.exercise.name ?? '')
  const finishTime = supersetTarget === null && total > 0 && (index >= total - 1 || allSetsDone(session))
  // The right-hand button needs the bar's room: Finish workout, or the
  // superset's next exercise with its name
  const wide = finishTime || supersetTarget !== null
  // A free workout with no exercise yet: the screen shows only how to add one
  const empty = total === 0
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
  // The exercise after this one (after its superset), with sets left; null
  // when none is (upNext). The "Up next" card under the sets names it
  const nextIndex = item ? upNext(session, index) : null
  const nextItem = nextIndex === null ? undefined : session.exercises[nextIndex]
  // The rest bar names it too, when the rest leads there: the exercise on
  // screen has no set left, and no exercise of its superset is waiting
  const restNext = item && !hasWorkLeft(item) && supersetTarget === null ? (nextItem?.exercise.name ?? null) : null
  /**
   * Where the running stopwatch is, from a row's point of view: on its
   * set, on another set, or none (SetRow's `stopwatch` prop).
   */
  const stopwatchFor = (setId: string) => (stopwatch === null ? null : stopwatch.set_id === setId ? 'this' : 'other')
  /**
   * What the plan asks of an exercise, "4 × 8–10 · 80 kg · 90 s"; null for
   * one added on the way, which has no plan item.
   */
  const planSummary = (exercise: WorkoutExercise) => (exercise.plan_item
    ? itemSummary(exercise.plan_item, { language: i18n.language, weightUnit: unit, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS, t })
    : null)
  const addOptions = { unit, language: i18n.language, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS }

  /**
   * The exercises picked in the library, added at the end with last time's
   * sets (none offline), and the first of them opened.
   * @param exercises the exercises ticked, in order
   */
  async function addExercises(exercises: Exercise[]) {
    const lastSets = await fetchLastSets(exercises.map(exercise => exercise.id)).catch(() => [])
    dispatch({ type: 'addExercises', exercises: exercises.map(exercise => exerciseFrom(exercise, lastSets, addOptions)) })
  }

  /**
   * Swap, from the exercise's menu: the exercise on screen gives its place
   * to the one picked, with that one's sets of last time (none offline).
   */
  async function swap(exercise: Exercise) {
    if (!item) return
    const lastSets = await fetchLastSets([exercise.id]).catch(() => [])
    dispatch({ type: 'swapExercise', exercise: index, replacement: swappedExercise(item, exercise, lastSets, addOptions) })
  }

  /**
   * Delete workout, from the Finish dialog, and Cancel workout on an empty free
   * workout: the workout is forgotten, and nothing is sent. Nothing needs
   * undoing on the server: a workout reaches it only at Finish, so until then
   * it lives on this phone alone. Then the plan's page, or Home for a free
   * workout, as ✕ does; `replace`: Back does not return to a workout that no
   * longer exists.
   */
  function discard() {
    storeActiveSession(null)
    void navigate(session.plan_id ? `/plans/${session.plan_id}` : '/', { replace: true })
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
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-4">
        <div className={cn(WORKOUT_COLUMN, 'flex items-center gap-2')}>
          <Button variant="ghost" size="icon-xl" aria-label={t('workout.close')} onClick={pauseAndLeave}>
            <X aria-hidden="true" />
          </Button>
          <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-extrabold">{session.day_name ?? t('workout.free')}</h1>
          <p className="font-semibold text-muted-foreground tabular-nums">
            <span className="sr-only">{`${t('workout.clock')}: `}</span>
            {clock(elapsedSeconds(session, now))}
          </p>
          {/* Outlined: there to stop early, not the next thing to do */}
          {!empty && <FinishButton {...finishProps} label={t('workout.done')} variant="outline" className="px-4" />}
        </div>
      </header>

      {/* Only the middle scrolls. `relative` keeps the absolutely positioned
          sr-only "Rest over" inside it, or the page grew taller than the
          screen */}
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
                <Button variant="outline" size="xl" onClick={discard}>{t('workout.cancel')}</Button>
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
                        aria-current={position === index ? 'step' : undefined}
                        onClick={() => dispatch({ type: 'goTo', exercise: position })}
                        className={cn(
                          'size-3 rounded-full',
                          position === index ? 'bg-primary ring-2 ring-primary/40' : exercise.sets.some(set => set.done) ? 'bg-primary/60' : exercise.skipped ? 'bg-muted-foreground/30' : 'bg-muted',
                        )}
                      />
                    </li>
                  ))}
                </ol>
                {/* With its words: a ＋ alone was not understood */}
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
                {/* Opens "How to do it"; the ⓘ in its corner says it can be
                    tapped. The photo is decoration: the button is named */}
                <button
                  type="button"
                  aria-label={t('workout.howTo.open', { name: item.exercise.name })}
                  aria-haspopup="dialog"
                  onClick={() => setInfoOpen(true)}
                  className="relative size-20 shrink-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {cover
                    ? <img src={cover.thumb_url} alt="" className="size-full rounded-2xl bg-muted object-cover" />
                    : <span aria-hidden="true" className="grid size-full place-items-center rounded-2xl bg-muted"><Dumbbell className="size-7 text-muted-foreground" /></span>}
                  <span aria-hidden="true" className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border bg-background">
                    <Info className="size-4 text-primary" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  {/* The larger target for the same panel, inside the heading
                      so the heading keeps the exercise's name */}
                  <h2 id="exercise-name" className="font-heading text-xl font-extrabold">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setInfoOpen(true)}
                      className="text-left underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none hover:decoration-primary focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {item.exercise.name}
                    </button>
                  </h2>
                  {item.plan_item && <p className="text-sm text-muted-foreground tabular-nums">{planSummary(item)}</p>}
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
                  // Only for an exercise added by hand
                  onRemove={canRemoveExercise(item) ? () => dispatch({ type: 'removeExercise', exercise: index }) : undefined}
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
                    stopwatch={stopwatchFor(set.id)}
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
                // The panel closes first: the set it shows is about to go
                onRemove={canRemoveSet(item, stepping.set)
                  ? () => {
                      setStepperOpen(false)
                      dispatch({ type: 'removeSet', exercise: index, set: stepping.set })
                    }
                  : undefined}
              />
              <ExercisePicker open={swapOpen} onOpenChange={setSwapOpen} replacing={item.exercise} onAdd={exercises => void (exercises[0] && swap(exercises[0]))} />
              {/* For the set more than planned (a good day, a back-off set);
                  it copies the last one's values */}
              <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'addSet', exercise: index })} className={cn('mt-2 w-full sm:mt-3', ADD_ICON)}>
                <Plus aria-hidden="true" />
                {t('plans.editor.addSet')}
              </Button>
              <ExerciseInfoSheet open={infoOpen} onOpenChange={setInfoOpen} exercise={item.exercise} />
              {/* Up next: a reminder of the exercise after this one, not a
                  way to go there (the bottom bar is). None on the last
                  one, where Finish workout waits below */}
              {nextItem && <UpNextCard item={nextItem} summary={planSummary(nextItem)} />}
            </section>
          )}

          <p aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </main>

      {/* The stopwatch of a timed set, docked under the sets while it runs
          (or is paused), where the rest bar goes. Last time's time as the
          clock shows it, "1:31". Done as fast as possible, it is a race:
          the target is a time to beat, and the reps to do are named after
          the set */}
      {stopwatch && timedItem && timedSet && (
        <StopwatchPanel
          stopwatch={stopwatch}
          exerciseName={timedItem.exercise.name}
          setName={timedName}
          race={isForTime(timedItem) ? { reps: Number(timedSet.reps) || null } : null}
          lastText={timedSet.last?.duration_seconds ? clock(timedSet.last.duration_seconds) : null}
          alarm={{ sound: user?.timer_sound ?? true, vibration: user?.timer_vibration ?? true }}
          onStop={() => dispatch({ type: 'stopStopwatch', now: new Date().toISOString() })}
          onPause={paused => dispatch({ type: paused ? 'pauseStopwatch' : 'resumeStopwatch', now: new Date().toISOString() })}
          onCancel={() => dispatch({ type: 'cancelStopwatch' })}
        />
      )}

      {/* The rest timer, while it runs, with the next exercise's name when
          the rest leads to it */}
      {session.rest !== null && (
        <RestBar
          left={left}
          total={session.rest.total}
          next={restNext}
          onAdjust={seconds => dispatch({ type: 'adjustRest', seconds })}
          onSkip={() => dispatch({ type: 'endRest' })}
        />
      )}

      {!empty && (
        <footer className="border-t pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className={cn(WORKOUT_COLUMN, 'flex justify-between gap-2')}>
            {/* Outlined: lime is kept for Finish workout. On a phone, when
                Finish workout needs the room, Previous is an arrow alone */}
            <Button variant="outline" size="xl" className={cn('px-4', wide && 'max-sm:px-3.5')} disabled={index === 0} onClick={() => dispatch({ type: 'goTo', exercise: index - 1 })}>
              <ChevronLeft aria-hidden="true" />
              <span className={cn(wide && 'max-sm:sr-only')}>{t('workout.previous')}</span>
            </Button>
            {/* In a superset, its next exercise by name: where the round goes
                on. Otherwise Next, or Finish workout. Across the bar on a
                phone, its own width from 640 px */}
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
