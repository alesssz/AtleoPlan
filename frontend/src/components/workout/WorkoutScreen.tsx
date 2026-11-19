/*
 * Workout mode. The session is stored on the device after every change, so
 * closing the app loses nothing and ✕ only pauses; nothing reaches the server
 * before Finish. Only what was added by hand can be removed: the plan's
 * exercises and sets are skipped or left unticked instead.
 *
 * One screen per run: an exercise on its own, or a whole superset, its sets
 * shown round by round and its next set marked. The dots, Previous and Next
 * move from run to run.
 */
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ListPlus, Plus, X } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
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
import { ADD_ICON, ExerciseBlock } from './ExerciseBlock'
import { SetStepper } from './SetStepper'
import { StopwatchPanel } from './StopwatchPanel'
import { SupersetRounds } from './SupersetRounds'
import { UpNextCard } from './UpNextCard'
import { FALLBACK_REST_SECONDS } from './useStartWorkout'
import { allSetsDone, canRemoveSet, countSets, elapsedSeconds, exerciseFrom, FALLBACK_COUNTDOWN_SECONDS, findSet, hasWorkLeft, isForTime, nextInRound, restLeft, setNumbers, stations, supersetOf, swappedExercise, upNext, workoutReducer, type ActiveSession, type SetField, type WorkoutExercise } from './workout-session'

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
  // The stepper, How to do it and Swap each serve one exercise of the screen
  // at a time, kept after closing so the panel keeps its content as it slides
  const [stepping, setStepping] = useState<{ exercise: number, set: number, field: SetField }>({ exercise: 0, set: 0, field: 'weight' })
  const [swapOpen, setSwapOpen] = useState(false)
  const [swapping, setSwapping] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)
  const [informing, setInforming] = useState(0)

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
  // The screen's exercises: this one alone, or its whole superset
  const group = supersetOf(session, index)
  const isSuperset = group.length > 1
  const runs = stations(session)
  const station = runs.findIndex(run => run.includes(index))
  const previousRun = runs[station - 1]
  const nextRun = runs[station + 1]
  const count = countSets(session)
  const finishProps = { count, disabled: finishing, onFinish: () => void finish(), onDiscard: discard }
  // Finish workout replaces Next on the last screen or when nothing is left
  // to tick; never with no exercise at all
  const finishTime = item !== undefined && (nextRun === undefined || allSetsDone(session))
  // A free workout before its first exercise
  const empty = session.exercises.length === 0
  const countdown = user?.countdown_seconds ?? FALLBACK_COUNTDOWN_SECONDS
  // A superset's next set, round by round
  const upcomingId = nextInRound(session, group)
  const stepItem = session.exercises[stepping.exercise]
  const stepNumber = setNumbers(stepItem?.sets ?? [])[stepping.set]
  const stepName = stepNumber?.warmUp ? t('workout.warmUpName', { number: stepNumber.number }) : t('workout.setName', { number: stepNumber?.number ?? stepping.set + 1 })
  const swapItem = session.exercises[swapping]
  const infoItem = session.exercises[informing]
  // Looked up by set id: the running stopwatch may belong to another exercise
  // than the ones on screen
  const stopwatch = session.stopwatch ?? null
  const timed = stopwatch ? findSet(session, stopwatch.set_id) : null
  const timedItem = timed ? session.exercises[timed.exercise] : undefined
  const timedSet = timed ? timedItem?.sets[timed.set] : undefined
  const timedNumber = timed && timedItem ? setNumbers(timedItem.sets)[timed.set] : undefined
  const timedName = timedNumber?.warmUp ? t('workout.warmUpName', { number: timedNumber.number }) : t('workout.setName', { number: timedNumber?.number ?? 1 })
  // The next exercise with sets left after this screen
  const nextIndex = item ? upNext(session, index) : null
  const nextItem = nextIndex === null ? undefined : session.exercises[nextIndex]
  // The rest bar names it only when the rest leads there: nothing left on
  // this screen
  const screenDone = !group.some(position => session.exercises[position] !== undefined && hasWorkLeft(session.exercises[position]))
  const restNext = item && screenDone ? (nextItem?.exercise.name ?? null) : null
  // SetRow's view of the running stopwatch: on this set, on another, or none
  const stopwatchFor = (setId: string) => (stopwatch === null ? null : stopwatch.set_id === setId ? 'this' : 'other')
  /** "4 × 8–10 · 80 kg · 90 s"; null for an exercise added during the workout. */
  const planSummary = (exercise: WorkoutExercise) => (exercise.plan_item
    ? itemSummary(exercise.plan_item, { language: i18n.language, weightUnit: unit, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS, t })
    : null)
  const addOptions = { unit, language: i18n.language, defaultRestSeconds: user?.default_rest_seconds ?? FALLBACK_REST_SECONDS }

  // After a tick on a superset's screen, its next set comes into view: it may
  // be in the other exercise, below. Not when the screen changes, which opens
  // at the top
  const shownRun = useRef(station)
  useEffect(() => {
    if (shownRun.current !== station) {
      shownRun.current = station
      return
    }
    if (upcomingId !== null) document.getElementById(`set-${upcomingId}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [upcomingId, station])

  /** Appends the exercises with their last sets (none offline) and opens the first. */
  async function addExercises(exercises: Exercise[]) {
    const lastSets = await fetchLastSets(exercises.map(exercise => exercise.id)).catch(() => [])
    dispatch({ type: 'addExercises', exercises: exercises.map(exercise => exerciseFrom(exercise, lastSets, addOptions)) })
  }

  /** Replaces the exercise being swapped, carrying the replacement's last sets (none offline). */
  async function swap(exercise: Exercise) {
    if (!swapItem) return
    const lastSets = await fetchLastSets([exercise.id]).catch(() => [])
    dispatch({ type: 'swapExercise', exercise: swapping, replacement: swappedExercise(swapItem, exercise, lastSets, addOptions) })
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

  function openStepper(exercise: number, set: number, field: SetField) {
    setStepping({ exercise, set, field })
    setStepperOpen(true)
  }

  function openInfo(exercise: number) {
    setInforming(exercise)
    setInfoOpen(true)
  }

  function openSwap(exercise: number) {
    setSwapping(exercise)
    setSwapOpen(true)
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
              out of the way, yet always at hand. One dot per screen: a
              superset is one */}
          {!empty && (
            <nav aria-label={t('workout.exerciseOf', { number: station + 1, total: runs.length })} className="mb-5">
              <div className="mb-2 flex items-center gap-3">
                <ol className="flex flex-wrap gap-1.5">
                  {runs.map((run, position) => {
                    const members = run.map(member => session.exercises[member]).filter(member => member !== undefined)
                    const name = members.map(member => member.exercise.name).join(' + ')
                    const skipped = members.every(member => member.skipped)
                    return (
                      <li key={members[0]?.id ?? position}>
                        <button
                          type="button"
                          aria-label={skipped ? t('workout.jumpToSkipped', { number: position + 1, name }) : t('workout.jumpTo', { number: position + 1, name })}
                          aria-current={position === station ? 'step' : undefined}
                          onClick={() => dispatch({ type: 'goTo', exercise: run[0]! })}
                          className={cn(
                            'size-3 rounded-full',
                            position === station ? 'bg-primary ring-2 ring-primary/40' : members.some(member => member.sets.some(set => set.done)) ? 'bg-primary/60' : skipped ? 'bg-muted-foreground/30' : 'bg-muted',
                          )}
                        />
                      </li>
                    )
                  })}
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
              <p className="text-sm text-muted-foreground">{t('workout.exerciseOf', { number: station + 1, total: runs.length })}</p>
            </nav>
          )}

          {/* A superset: its exercises' headers, then its sets round by
              round, as it is done */}
          {item && isSuperset && (
            <SupersetRounds
              // A superset of its own: rounds and headers opened by a tap do
              // not carry over to the next one
              key={session.exercises[group[0]!]?.id}
              session={session}
              group={group}
              unit={unit}
              summaryOf={planSummary}
              stopwatchFor={stopwatchFor}
              upcomingId={upcomingId}
              countdown={countdown}
              dispatch={dispatch}
              onOpenInfo={openInfo}
              onSwap={openSwap}
              onOpenStepper={openStepper}
            />
          )}

          {item && !isSuperset && (
            <ExerciseBlock
              item={item}
              index={index}
              unit={unit}
              summary={planSummary(item)}
              stopwatchFor={stopwatchFor}
              upcomingId={null}
              countdown={countdown}
              dispatch={dispatch}
              onOpenInfo={() => openInfo(index)}
              onSwap={() => openSwap(index)}
              onOpenStepper={(set, field) => openStepper(index, set, field)}
            />
          )}

          {/* One of each panel, for whichever exercise opened it */}
          {stepItem && (
            <SetStepper
              open={stepperOpen}
              onOpenChange={setStepperOpen}
              set={stepItem.sets[stepping.set]}
              name={stepName}
              exerciseName={stepItem.exercise.name}
              loggingType={stepItem.exercise.logging_type}
              forTime={isForTime(stepItem)}
              unit={unit}
              weightStep={user?.weight_step}
              focus={stepping.field}
              onChange={(field, value) => dispatch({ type: 'setField', exercise: stepping.exercise, set: stepping.set, field, value })}
              // The panel closes first: the set it shows is about to go
              onRemove={canRemoveSet(stepItem, stepping.set)
                ? () => {
                    setStepperOpen(false)
                    dispatch({ type: 'removeSet', exercise: stepping.exercise, set: stepping.set })
                  }
                : undefined}
            />
          )}
          {swapItem && <ExercisePicker open={swapOpen} onOpenChange={setSwapOpen} replacing={swapItem.exercise} onAdd={exercises => void (exercises[0] && swap(exercises[0]))} />}
          {infoItem && <ExerciseInfoSheet open={infoOpen} onOpenChange={setInfoOpen} exercise={infoItem.exercise} />}

          {/* A reminder only: the bottom bar is the way there. Absent on the
              last screen, where Finish workout waits */}
          {nextItem && <UpNextCard item={nextItem} summary={planSummary(nextItem)} />}

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
          onStartNow={() => dispatch({ type: 'skipCountdown', now: new Date().toISOString() })}
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
                Previous shrinks to an arrow when Finish workout needs room */}
            <Button variant="outline" size="xl" className={cn('px-4', finishTime && 'max-sm:px-3.5')} disabled={previousRun === undefined} onClick={() => previousRun && dispatch({ type: 'goTo', exercise: previousRun[0]! })}>
              <ChevronLeft aria-hidden="true" />
              <span className={cn(finishTime && 'max-sm:sr-only')}>{t('workout.previous')}</span>
            </Button>
            {finishTime || nextRun === undefined
              ? <FinishButton {...finishProps} label={t('workout.finishWorkout')} className="min-w-0 flex-1 sm:flex-none" />
              : (
                  <Button variant="outline" size="xl" className="px-4" onClick={() => dispatch({ type: 'goTo', exercise: nextRun[0]! })}>
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
