/*
 * Workout mode. The session is stored on the device after every change, so
 * closing the app loses nothing and ✕ only pauses; nothing reaches the server
 * before Finish. Only what was added by hand can be removed: the plan's
 * exercises and sets are skipped or left unticked instead.
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

// Add buttons are outlined like Previous and Next, with a lime ＋
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
  // Announced through aria-live when a rest ends
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

  // Fires when the rest ends; a new rest or an adjustment replaces it
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
  // W W 1 2 3: warm-ups numbered apart
  const numbers = setNumbers(item?.sets ?? [])
  const count = countSets(session)
  const finishProps = { count, disabled: finishing, onFinish: () => void finish(), onDiscard: discard }
  // In a superset, its next exercise with a set left; null outside a superset
  // or when it is done. The screen never moves by itself after a tick
  const supersetTarget = supersetNext(session, index)
  const supersetName = supersetTarget === null ? '' : (session.exercises[supersetTarget]?.exercise.name ?? '')
  // Finish workout replaces Next on the last exercise or when nothing is left
  // to tick; never with no exercise at all
  const finishTime = supersetTarget === null && total > 0 && (index >= total - 1 || allSetsDone(session))
  // Finish workout, or the superset's next exercise by name, needs the bar's room
  const wide = finishTime || supersetTarget !== null
  // A free workout before its first exercise
  const empty = total === 0
  const stepNumber = numbers[stepping.set]
  const stepName = stepNumber?.warmUp ? t('workout.warmUpName', { number: stepNumber.number }) : t('workout.setName', { number: stepNumber?.number ?? stepping.set + 1 })
  // Looked up by set id: the running stopwatch may belong to another exercise
  // than the one on screen
  const stopwatch = session.stopwatch ?? null
  const timed = stopwatch ? findSet(session, stopwatch.set_id) : null
  const timedItem = timed ? session.exercises[timed.exercise] : undefined
  const timedSet = timed ? timedItem?.sets[timed.set] : undefined
  const timedNumber = timed && timedItem ? setNumbers(timedItem.sets)[timed.set] : undefined
  const timedName = timedNumber?.warmUp ? t('workout.warmUpName', { number: timedNumber.number }) : t('workout.setName', { number: timedNumber?.number ?? 1 })
  // The next exercise with sets left after this one and its superset
  const nextIndex = item ? upNext(session, index) : null
  const nextItem = nextIndex === null ? undefined : session.exercises[nextIndex]
  // The rest bar names it only when the rest leads there: no set left here,
  // and none waiting in the superset
  const restNext = item && !hasWorkLeft(item) && supersetTarget === null ? (nextItem?.exercise.name ?? null) : null
  // SetRow's view of the running stopwatch: on this set, on another, or none
  const stopwatchFor = (setId: string) => (stopwatch === null ? null : stopwatch.set_id === setId ? 'this' : 'other')
  /** "4 × 8–10 · 80 kg · 90 s"; null for an exercise added during the workout. */
  const planSummary = (exercise: WorkoutExercise) => (exercise.plan_item
    ? itemSummary(exercise.plan_item, { language: i18n.language, weightUnit: unit, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS, t })
    : null)
  const addOptions = { unit, language: i18n.language, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS }

  /** Appends the exercises with their last sets (none offline) and opens the first. */
  async function addExercises(exercises: Exercise[]) {
    const lastSets = await fetchLastSets(exercises.map(exercise => exercise.id)).catch(() => [])
    dispatch({ type: 'addExercises', exercises: exercises.map(exercise => exerciseFrom(exercise, lastSets, addOptions)) })
  }

  /** Replaces the exercise on screen, carrying the replacement's last sets (none offline). */
  async function swap(exercise: Exercise) {
    if (!item) return
    const lastSets = await fetchLastSets([exercise.id]).catch(() => [])
    dispatch({ type: 'swapExercise', exercise: index, replacement: swappedExercise(item, exercise, lastSets, addOptions) })
  }

  /**
   * Forgets the workout without sending anything: a workout reaches the server
   * only at Finish. `replace` keeps Back from returning to a workout that no
   * longer exists.
   */
  function discard() {
    storeActiveSession(null)
    void navigate(session.plan_id ? `/plans/${session.plan_id}` : '/', { replace: true })
  }

  /** Pauses the workout, keeps it on the device, and leaves. */
  function pauseAndLeave() {
    // Stored directly: after navigate() this screen is gone, so a dispatch would never be saved
    storeActiveSession(workoutReducer(session, { type: 'pause', now: new Date().toISOString() }))
    void navigate(session.plan_id ? `/plans/${session.plan_id}` : '/')
  }

  /** Finishes, queues, tries to send, and opens the summary. */
  async function finish() {
    setFinishing(true)
    // `replace`: Back must not return to a finished workout
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
          {/* Outlined: stopping early is not the next step */}
          {!empty && <FinishButton {...finishProps} label={t('workout.done')} variant="outline" className="px-4" />}
        </div>
      </header>

      {/* Only the middle scrolls. `relative` contains the sr-only live region,
          which otherwise made the page taller than the screen */}
      <main className="relative flex-1 overflow-y-auto py-5 sm:py-6">
        <div className={WORKOUT_COLUMN}>
          {/* Cancel is the way out of a free workout started by mistake */}
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

          {/* Adding exercises sits beside the dots: rare in a planned day, so
              out of the way, yet always at hand */}
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
                {/* Labelled: a ＋ alone is not understood */}
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
              <div className="mb-6 flex gap-4">
                {/* The ⓘ badge says the photo opens How to do it; the photo
                    is decorative, the button carries the label */}
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
                  {/* A larger target for the same panel, inside the heading
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
                  {/* Today's note, written from the menu */}
                  {item.notes && (
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{`${t('workout.yourNote')}: `}</span>
                      {item.notes}
                    </p>
                  )}
                  {/* Explains why Next, at the bottom, names another exercise */}
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
                  // Only exercises added by hand can be removed
                  onRemove={canRemoveExercise(item) ? () => dispatch({ type: 'removeExercise', exercise: index }) : undefined}
                />
              </div>

              {/* The sets stay, dimmed: ticking one undoes the skip */}
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
              {/* Copies the last set's values */}
              <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'addSet', exercise: index })} className={cn('mt-2 w-full sm:mt-3', ADD_ICON)}>
                <Plus aria-hidden="true" />
                {t('plans.editor.addSet')}
              </Button>
              <ExerciseInfoSheet open={infoOpen} onOpenChange={setInfoOpen} exercise={item.exercise} />
              {/* A reminder only: the bottom bar is the way there. Absent on
                  the last exercise, where Finish workout waits */}
              {nextItem && <UpNextCard item={nextItem} summary={planSummary(nextItem)} />}
            </section>
          )}

          <p aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </main>

      {/* Docked where the rest bar goes. In a race (as fast as possible) the
          target is a time to beat, and the reps are named after the set */}
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
            {/* Outlined: lime is reserved for Finish workout. On a phone,
                Previous shrinks to an arrow when the right button needs room */}
            <Button variant="outline" size="xl" className={cn('px-4', wide && 'max-sm:px-3.5')} disabled={index === 0} onClick={() => dispatch({ type: 'goTo', exercise: index - 1 })}>
              <ChevronLeft aria-hidden="true" />
              <span className={cn(wide && 'max-sm:sr-only')}>{t('workout.previous')}</span>
            </Button>
            {/* In a superset the round goes on to its next exercise, by name;
                otherwise Next, or Finish workout */}
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
