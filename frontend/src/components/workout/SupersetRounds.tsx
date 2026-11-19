/*
 * A superset's screen, read as it is done: round by round ("hang → pull-ups
 * → rest, three times").
 *
 * On top, its exercises' headers (photo, name, plan's line, menu), side by
 * side from the tablet up; with three or more, a phone shows them as one line
 * that opens. Then the rounds: the one in progress open, with each
 * exercise's set in order and the rest that closes it; the others one line
 * each ("Round 1 ✓ 30 s · 5"), two or more in a row merged into one
 * ("Rounds 1–3"). A tap opens a line: one round as a round, a merged line as
 * one compact block with all its rows. What is not needed now is a line that
 * opens, so the screen stays short with six rounds of four exercises.
 */
import { Check, ChevronDown, ChevronUp, Dumbbell, Link2, Plus } from 'lucide-react'
import { useId, useState, type Dispatch, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatSeconds } from '@/components/plans/plan-format'
import { Button } from '@/components/ui/button'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ADD_ICON, ExerciseHeader } from './ExerciseBlock'
import { SetRow } from './SetRow'
import { workoutSetText } from './set-text'
import { closeRounds, roundBlocks, type OpenedRounds } from './superset-rounds'
import { isForTime, setNumbers, type ActiveSession, type SetField, type WorkoutAction, type WorkoutExercise } from './workout-session'

/** From this many exercises, a phone shows their headers as one line that opens. */
const GROUP_HEADERS_FROM = 3

/** The headers side by side from the tablet up, up to four in a row. */
const HEADER_COLUMNS: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

interface SupersetRoundsProps {
  session: ActiveSession
  /** The superset's exercises, by their positions in the workout. */
  group: readonly number[]
  unit: WeightUnit
  /** What the plan asks of an exercise; null for one added on the way. */
  summaryOf: (item: WorkoutExercise) => string | null
  /** The running stopwatch, as SetRow takes it, by set id. */
  stopwatchFor: (setId: string) => 'this' | 'other' | null
  /** The set to do next, round by round; its round is the one open. */
  upcomingId: string | null
  /** The seconds to get ready before a timed set (Profile). */
  countdown: number
  dispatch: Dispatch<WorkoutAction>
  onOpenInfo: (exercise: number) => void
  onSwap: (exercise: number) => void
  onOpenStepper: (exercise: number, set: number, field: SetField) => void
}

interface Member {
  position: number
  item: WorkoutExercise
}

export function SupersetRounds({ session, group, unit, summaryOf, stopwatchFor, upcomingId, countdown, dispatch, onOpenInfo, onSwap, onOpenStepper }: SupersetRoundsProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const listId = useId()
  const [headersOpen, setHeadersOpen] = useState(false)
  // Lines opened by a tap, and the round in progress when closed by one; a
  // new round in progress opens, since it is not the one closed
  const [opened, setOpened] = useState<readonly OpenedRounds[]>([])
  const [currentClosed, setCurrentClosed] = useState<number | null>(null)
  const members: Member[] = group.flatMap(position => (session.exercises[position] ? [{ position, item: session.exercises[position] }] : []))
  const names = members.map(({ item }) => item.exercise.name).join(' + ')
  // Supersets may pair different counts (3 of A, 4 of B): the last rounds
  // then hold only the exercises that still have a set
  const rounds = Math.max(0, ...members.map(({ item }) => item.sets.length))
  const inRound = (round: number) => members.filter(({ item }) => item.sets[round] !== undefined)
  const isDone = (round: number) => inRound(round).every(({ item }) => item.sets[round]?.done)
  const isCurrent = (round: number) => inRound(round).some(({ item }) => item.sets[round]?.id === upcomingId)
  const grouped = members.length >= GROUP_HEADERS_FROM

  /** "30 s · 5": a round's sets, in order. */
  const roundText = (round: number) => inRound(round)
    .map(({ item }) => workoutSetText(item.sets[round]!, item.exercise.logging_type, language, isForTime(item)))
    .join(' · ')

  const openRounds = (from: number, to: number, done: boolean) => setOpened(previous => [...closeRounds(previous, from, to), { from, to, done }])
  const close = (from: number, to: number) => setOpened(previous => closeRounds(previous, from, to))

  /** An exercise's set in a round, named for the round's other sets beside it. */
  const memberSet = (round: number, { position, item }: Member, label: string) => {
    const set = item.sets[round]!
    return (
      <MemberSet
        key={set.id}
        label={label}
        name={item.exercise.name}
        skipped={Boolean(item.skipped)}
      >
        <SetRow
          set={set}
          number={setNumbers(item.sets)[round] ?? { warmUp: false, number: round + 1 }}
          loggingType={item.exercise.logging_type}
          unit={unit}
          forTime={isForTime(item)}
          onToggle={() => dispatch({ type: 'toggleSet', exercise: position, set: round, now: new Date().toISOString() })}
          onOpenStepper={field => onOpenStepper(position, round, field)}
          onTypeChange={setType => dispatch({ type: 'setSetType', exercise: position, set: round, setType })}
          onStartStopwatch={() => dispatch({ type: 'startStopwatch', exercise: position, set: round, now: new Date().toISOString(), countdown })}
          stopwatch={stopwatchFor(set.id)}
          upcoming={set.id === upcomingId}
          units
        />
      </MemberSet>
    )
  }

  return (
    <section aria-label={t('workout.superset', { names })} className="border-l-4 border-primary pl-3 sm:pl-4">
      <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Link2 aria-hidden="true" className="size-4 shrink-0" />
        {t('workout.supersetRounds', { count: rounds })}
      </p>

      {/* Three exercises or more: on a phone, one line that opens, as the
          closed rounds; side by side from the tablet up, where they fit */}
      {grouped && (
        <button
          type="button"
          aria-expanded={headersOpen}
          aria-controls={listId}
          onClick={() => setHeadersOpen(open => !open)}
          className="mb-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 sm:hidden"
        >
          <span aria-hidden="true" className="flex shrink-0">
            {members.slice(0, 4).map(({ item }, index) => {
              const cover = item.exercise.photos[0]
              return cover
                ? <img key={item.id} src={cover.thumb_url} alt="" className={cn('size-8 rounded-lg border-2 border-background bg-muted object-cover', index > 0 && '-ml-3')} />
                : <span key={item.id} className={cn('grid size-8 place-items-center rounded-lg border-2 border-background bg-muted', index > 0 && '-ml-3')}><Dumbbell className="size-4 text-muted-foreground" /></span>
            })}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t('workout.exercisesCount', { count: members.length })}</span>
            <span className="block truncate text-sm text-muted-foreground">{members.map(({ item }) => item.exercise.name).join(' · ')}</span>
          </span>
          <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 text-muted-foreground transition-transform', headersOpen && 'rotate-180')} />
        </button>
      )}
      <div id={listId} className={cn('mb-2 grid gap-x-6', HEADER_COLUMNS[Math.min(members.length, 4)], grouped && !headersOpen && 'max-sm:hidden')}>
        {members.map(({ position, item }) => (
          <MemberHeader key={item.id} item={item} position={position} summary={summaryOf(item)} dispatch={dispatch} onOpenInfo={onOpenInfo} onSwap={onSwap} />
        ))}
      </div>

      <ol className="flex flex-col gap-3">
        {roundBlocks(rounds, isCurrent, isDone, opened, currentClosed).map((block) => {
          if (block.kind === 'line') {
            const name = block.from === block.to ? t('workout.round', { number: block.from + 1 }) : t('workout.roundsRange', { from: block.from + 1, to: block.to + 1 })
            const state = block.current ? t('workout.roundStateCurrent') : block.done ? t('workout.roundStateDone', { count: block.to - block.from + 1 }) : t('workout.roundStateTodo')
            const summary = roundText(block.from)
            return (
              <li key={`line-${block.from}`}>
                <button
                  type="button"
                  aria-expanded={false}
                  aria-label={t('workout.roundFold', { name, state, summary })}
                  onClick={() => (block.current ? setCurrentClosed(null) : openRounds(block.from, block.to, block.done))}
                  // The round in progress, closed, keeps its lime outline
                  className={cn('flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50', block.current && 'border-primary')}
                >
                  {block.done
                    ? <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" strokeWidth={3} /></span>
                    : <span aria-hidden="true" className={cn('size-5 shrink-0 rounded-full border-2', block.current && 'border-primary')} />}
                  <span className={cn('shrink-0 font-semibold', block.current && 'text-primary')}>{name}</span>
                  <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground tabular-nums">{summary}</span>
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )
          }
          if (block.kind === 'span') {
            // A merged line, opened: every round's rows in one block, each
            // named by its round, without the cards and rests in between
            const spanRounds = Array.from({ length: block.to - block.from + 1 }, (_, offset) => block.from + offset)
            return (
              <li key={`span-${block.from}`}>
                <Round
                  title={t('workout.roundsRange', { from: block.from + 1, to: block.to + 1 })}
                  done={spanRounds.every(isDone)}
                  onClose={() => close(block.from, block.to)}
                >
                  {spanRounds.map(round => (
                    <div key={round} className="flex flex-col gap-3 [&+&]:border-t [&+&]:pt-3">
                      {inRound(round).map(member => memberSet(round, member, t('workout.roundExercise', { number: round + 1, name: member.item.exercise.name })))}
                    </div>
                  ))}
                </Round>
              </li>
            )
          }
          const round = block.round
          const sets = inRound(round)
          // The rest after a round is the one of its last exercise, which
          // the reducer starts when that set is ticked
          const rest = sets[sets.length - 1]?.item.rest_seconds ?? 0
          const current = isCurrent(round)
          return (
            <li key={`round-${round}`}>
              <Round
                title={t('workout.round', { number: round + 1 })}
                current={current}
                done={isDone(round)}
                rest={rest > 0 ? formatSeconds(rest, language) : null}
                // The round in progress closes into a line of its own
                onClose={current ? () => setCurrentClosed(round) : () => close(round, round)}
              >
                {sets.map(member => memberSet(round, member, member.item.exercise.name))}
              </Round>
            </li>
          )
        })}
      </ol>

      {/* A set more of each exercise: one more round */}
      <Button
        variant="outline"
        size="xl"
        onClick={() => members.forEach(({ position }) => dispatch({ type: 'addSet', exercise: position }))}
        className={cn('mt-3 w-full', ADD_ICON)}
      >
        <Plus aria-hidden="true" />
        {t('workout.addRound')}
      </Button>
    </section>
  )
}

interface MemberHeaderProps {
  item: WorkoutExercise
  position: number
  summary: string | null
  dispatch: Dispatch<WorkoutAction>
  onOpenInfo: (exercise: number) => void
  onSwap: (exercise: number) => void
}

/** An exercise's header, a section named by it, as on a screen of its own. */
function MemberHeader({ item, position, summary, dispatch, onOpenInfo, onSwap }: MemberHeaderProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <ExerciseHeader item={item} index={position} headingId={headingId} summary={summary} compact dispatch={dispatch} onOpenInfo={() => onOpenInfo(position)} onSwap={() => onSwap(position)} />
    </section>
  )
}

interface MemberSetProps {
  /** Its name for screen readers: the exercise, or "Round 2: Pullups" in a block of rounds. */
  label: string
  /** The exercise's name, shown. */
  name: string
  skipped: boolean
  children: ReactNode
}

/**
 * An exercise's set in a round: its name beside the row where it fits,
 * above it on a phone. A group named by the exercise, since a round holds a
 * "Set 1" of each.
 */
function MemberSet({ label, name, skipped, children }: MemberSetProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3', skipped && 'opacity-60')}>
      <p className="truncate px-1 text-sm font-semibold sm:w-40 sm:shrink-0">{label === name ? name : label}</p>
      <ol className="min-w-0 flex-1">{children}</ol>
    </div>
  )
}

interface RoundProps {
  /** "Round 2", or "Rounds 1–3" for a merged line opened. */
  title: string
  /** Holds the set to do next: outlined. */
  current?: boolean
  /** Every set ticked: tinted, like a ticked row. */
  done: boolean
  /** The rest that closes it, as text; null or missing with none. */
  rest?: string | null
  /** Closes it into a line; the whole title bar is the button. */
  onClose?: () => void
  children: ReactNode
}

function Round({ title, current = false, done, rest = null, onClose, children }: RoundProps) {
  const { t } = useTranslation()
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-3 rounded-2xl border p-3', current && 'border-primary', done && 'bg-primary/5')}>
      <h2 id={headingId} className={cn('text-xs font-bold tracking-wider uppercase', current ? 'text-primary' : 'text-muted-foreground', !onClose && 'px-1')}>
        {onClose
          ? (
              // The whole bar, a target as wide as the card, as the lines are
              <button type="button" aria-expanded onClick={onClose} className="-m-1 flex min-h-11 w-[calc(100%+0.5rem)] items-center gap-2 rounded-xl px-2 text-left uppercase outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50">
                {title}
                <ChevronUp aria-hidden="true" className="ml-auto size-5 shrink-0" />
              </button>
            )
          : title}
      </h2>
      {children}
      {rest && <p className="px-1 text-sm text-muted-foreground">{t('workout.thenRest', { time: rest })}</p>}
    </section>
  )
}
