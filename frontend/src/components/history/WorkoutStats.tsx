/*
 * The four numbers of a finished workout, as tiles: time trained, exercises,
 * sets and reps. Shown by the summary and by a workout's page in history; the
 * numbers come from totals.ts. Same look as Home's week numbers
 * (src/components/home/WeekStats.tsx).
 */
import { useTranslation } from 'react-i18next'
import { formatDuration, formatNumber } from '@/lib/format'
import type { Totals } from './totals'

interface WorkoutStatsProps {
  /** The workout's numbers. */
  totals: Totals
}

export function WorkoutStats({ totals }: WorkoutStatsProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language

  const stats = [
    // A dash when the time is unknown (a workout sent by an older app)
    { label: t('history.statDuration'), value: totals.durationSeconds === null ? '–' : formatDuration(totals.durationSeconds, language) },
    { label: t('history.statExercises'), value: formatNumber(totals.exercises, language) },
    { label: t('history.statSets'), value: formatNumber(totals.sets, language) },
    // Reps, the body alone included: unlike the volume, they count pull-ups
    { label: t('history.statReps'), value: formatNumber(totals.reps, language) },
  ]

  return (
    // The value shows above its label; screen readers keep label first
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-2xl bg-muted/60 p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
          <dd className="font-heading text-2xl font-black tracking-tight whitespace-nowrap tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
