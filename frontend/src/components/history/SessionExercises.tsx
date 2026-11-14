/*
 * The exercises of a workout and their sets, in the summary and on a workout's
 * page in history: each exercise with its photo and name; how it went against
 * last time ("Better", then "82,5×8 · last time 80×8", compare.ts); its sets as
 * a gym writes them, numbered as in workout mode: warm-ups as W1, W2, then 1,
 * 2, 3 ("W1 40×10", "1 80×8"); and, for an exercise with weights, its own
 * volume. An exercise skipped (no set) says so.
 */
import { Dumbbell, Minus, Sparkles, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SessionExercise } from '@/api/sessions'
import { loggedSetText } from '@/components/workout/set-text'
import { setNumbers } from '@/components/workout/workout-session'
import { weightIn } from '@/components/plans/plan-format'
import { formatWeight, type WeightUnit } from '@/lib/format'
import { cn } from '@/lib/utils'
import { exerciseVolume, type Comparison, type Verdict } from './compare'

const VERDICTS: Record<Verdict, { icon: LucideIcon, className: string, key: `compare.${Verdict}` }> = {
  // Lime for better only: the same or lower is said quietly, not as a failure
  better: { icon: TrendingUp, className: 'text-primary', key: 'compare.better' },
  same: { icon: Minus, className: 'text-muted-foreground', key: 'compare.same' },
  worse: { icon: TrendingDown, className: 'text-muted-foreground', key: 'compare.worse' },
  first: { icon: Sparkles, className: 'text-muted-foreground', key: 'compare.first' },
}

interface SessionExercisesProps {
  /** The workout's exercises, in order: from the API, or built from the phone by the summary. */
  exercises: SessionExercise[]
  /** Each exercise against last time, in the same order (compareWorkout); null for one skipped. */
  comparisons: (Comparison | null)[]
  unit: WeightUnit
}

export function SessionExercises({ exercises, comparisons, unit }: SessionExercisesProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  return (
    <ol className="flex flex-col gap-3">
      {exercises.map((item, index) => {
        const cover = item.exercise.photos[0]
        // W1 W2 1 2 3: warm-ups counted apart, as in workout mode
        const numbers = setNumbers(item.sets)
        const loggingType = item.exercise.logging_type
        const comparison = comparisons[index] ?? null
        const look = comparison ? VERDICTS[comparison.verdict] : null
        const volume = loggingType === 'weight_reps' ? exerciseVolume(item.sets) : 0
        return (
          <li key={item.id} className="flex gap-4 rounded-2xl border bg-card/60 p-4">
            {cover
              ? <img src={cover.thumb_url} alt="" className="size-14 shrink-0 rounded-xl bg-muted object-cover" />
              : <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted"><Dumbbell className="size-6 text-muted-foreground" /></div>}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{item.exercise.name}</h3>
              {/* Two lines at every width: on one, the second part wrapped
                  half-way on a phone */}
              {comparison && look && (
                <>
                  <p className={cn('mt-0.5 flex items-center gap-1.5 text-sm font-semibold', look.className)}>
                    <look.icon aria-hidden="true" className="size-4 shrink-0" />
                    {t(look.key)}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {loggedSetText(comparison.best, loggingType, unit, language)}
                    {comparison.previousBest && ` · ${t('compare.lastTime', { set: loggedSetText(comparison.previousBest, loggingType, unit, language) })}`}
                  </p>
                </>
              )}
              {item.sets.length === 0
                ? <p className="text-sm text-muted-foreground">{t('history.skipped')}</p>
                : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {item.sets.map((set, position) => {
                        const number = numbers[position] ?? { warmUp: false, number: position + 1 }
                        // A drop set or a set to failure says so in words
                        const label = number.warmUp ? `W${number.number}` : String(number.number)
                        return (
                          <li key={set.id} className={cn('rounded-lg px-2.5 py-1 text-sm tabular-nums', number.warmUp ? 'bg-muted text-muted-foreground' : 'bg-primary/10')}>
                            <span className="mr-1.5 font-bold">{label}</span>
                            {loggedSetText(set, loggingType, unit, language)}
                            {set.set_type !== 'normal' && set.set_type !== 'warm_up' && (
                              <span className="ml-1.5 text-xs text-muted-foreground">{t(`plans.editor.setTypes.${set.set_type}`)}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
              {/* Meaningful for one exercise, never added across exercises */}
              {volume > 0 && (
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {t('history.exerciseVolume', { amount: formatWeight(Math.round(weightIn(volume, unit)), language, unit) })}
                </p>
              )}
              {item.notes && <p className="mt-2 text-sm italic">{item.notes}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
