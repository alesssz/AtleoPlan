/*
 * One exercise in workout mode: its header (ExerciseHeader: photo and name,
 * both opening How to do it, what the plan asks, the notes, the menu), then
 * its sets and Add set. A superset's screen shows the headers alone and the
 * sets by round (SupersetRounds). The panels they open (stepper, How to do
 * it, Swap) belong to the screen, which keeps one of each.
 */
import { Dumbbell, Info, Plus } from 'lucide-react'
import { useId, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ExerciseMenu } from './ExerciseMenu'
import { SetHeader, SetRow } from './SetRow'
import { canRemoveExercise, isForTime, setNumbers, type SetField, type WorkoutAction, type WorkoutExercise } from './workout-session'

// Add buttons are outlined like Previous and Next, with a lime ＋
export const ADD_ICON = '[&_svg]:text-primary'

interface ExerciseHeaderProps {
  item: WorkoutExercise
  /** Its position in the workout, for the actions. */
  index: number
  /** The id of its <h2>, which names the section around it. */
  headingId: string
  /** What the plan asks, "4 × 8–10 · 80 kg · 90 s"; null for an exercise added on the way. */
  summary: string | null
  /** In a superset: a smaller photo, so the exercises fit one screen. */
  compact?: boolean
  dispatch: Dispatch<WorkoutAction>
  onOpenInfo: () => void
  onSwap: () => void
}

/**
 * The exercise's photo and name, what the plan asks, its notes and its menu;
 * when skipped, the box that takes the skip back.
 */
export function ExerciseHeader({ item, index, headingId, summary, compact = false, dispatch, onOpenInfo, onSwap }: ExerciseHeaderProps) {
  const { t } = useTranslation()
  const cover = item.exercise.photos[0]

  return (
    <>
      <div className={cn('flex gap-4', compact ? 'mb-4' : 'mb-6')}>
        {/* The ⓘ badge says the photo opens How to do it; the photo is
            decorative, the button carries the label */}
        <button
          type="button"
          aria-label={t('workout.howTo.open', { name: item.exercise.name })}
          aria-haspopup="dialog"
          onClick={onOpenInfo}
          className={cn('relative shrink-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50', compact ? 'size-14' : 'size-20')}
        >
          {cover
            ? <img src={cover.thumb_url} alt="" className="size-full rounded-2xl bg-muted object-cover" />
            : <span aria-hidden="true" className="grid size-full place-items-center rounded-2xl bg-muted"><Dumbbell className="size-7 text-muted-foreground" /></span>}
          <span aria-hidden="true" className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border bg-background">
            <Info className="size-4 text-primary" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          {/* A larger target for the same panel, inside the heading so the
              heading keeps the exercise's name */}
          <h2 id={headingId} className={cn('font-heading font-extrabold', compact ? 'text-lg' : 'text-xl')}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={onOpenInfo}
              className="text-left underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none hover:decoration-primary focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.exercise.name}
            </button>
          </h2>
          {summary && <p className="text-sm text-muted-foreground tabular-nums">{summary}</p>}
          {item.plan_item?.notes && <p className="mt-1 text-sm italic">{item.plan_item.notes}</p>}
          {/* Today's note, written from the menu */}
          {item.notes && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">{`${t('workout.yourNote')}: `}</span>
              {item.notes}
            </p>
          )}
        </div>
        <ExerciseMenu
          item={item}
          onSwap={onSwap}
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
    </>
  )
}

interface ExerciseBlockProps {
  item: WorkoutExercise
  /** Its position in the workout, for the actions. */
  index: number
  unit: WeightUnit
  /** What the plan asks, "4 × 8–10 · 80 kg · 90 s"; null for an exercise added on the way. */
  summary: string | null
  /** The running stopwatch, as SetRow takes it, by set id. */
  stopwatchFor: (setId: string) => 'this' | 'other' | null
  /** The set to do next on a superset's screen; null elsewhere. */
  upcomingId: string | null
  /** The seconds to get ready before a timed set (Profile). */
  countdown: number
  dispatch: Dispatch<WorkoutAction>
  onOpenInfo: () => void
  onSwap: () => void
  onOpenStepper: (set: number, field: SetField) => void
}

export function ExerciseBlock({ item, index, unit, summary, stopwatchFor, upcomingId, countdown, dispatch, onOpenInfo, onSwap, onOpenStepper }: ExerciseBlockProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const forTime = isForTime(item)
  // W W 1 2 3: warm-ups numbered apart
  const numbers = setNumbers(item.sets)

  return (
    <section aria-labelledby={headingId}>
      <ExerciseHeader item={item} index={index} headingId={headingId} summary={summary} dispatch={dispatch} onOpenInfo={onOpenInfo} onSwap={onSwap} />

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
            onOpenStepper={field => onOpenStepper(position, field)}
            onTypeChange={setType => dispatch({ type: 'setSetType', exercise: index, set: position, setType })}
            onStartStopwatch={() => dispatch({ type: 'startStopwatch', exercise: index, set: position, now: new Date().toISOString(), countdown })}
            stopwatch={stopwatchFor(set.id)}
            upcoming={set.id === upcomingId}
          />
        ))}
      </ol>
      {/* Copies the last set's values */}
      <Button variant="outline" size="xl" onClick={() => dispatch({ type: 'addSet', exercise: index })} className={cn('mt-2 w-full sm:mt-3', ADD_ICON)}>
        <Plus aria-hidden="true" />
        {t('plans.editor.addSet')}
      </Button>
    </section>
  )
}
