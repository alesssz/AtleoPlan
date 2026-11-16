/*
 * The current week's numbers on Home. Minutes, not volume: volume adds up
 * unlike exercises and counts nothing done with the body alone. Minutes, not
 * "2 h 35 min": a single number fits a third of a phone's width.
 */
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/format'

interface WeekStatsProps {
  workouts?: number
  /** Warm-ups excluded. */
  sets?: number
  /** Pauses left out. */
  minutes?: number
}

export function WeekStats({ workouts = 0, sets = 0, minutes = 0 }: WeekStatsProps) {
  const { t, i18n } = useTranslation()

  const stats = [
    { label: t('home.statWorkouts'), value: formatNumber(workouts, i18n.language) },
    { label: t('home.statSets'), value: formatNumber(sets, i18n.language) },
    { label: t('home.statMinutes'), value: formatNumber(minutes, i18n.language) },
  ]

  return (
    <dl className="grid grid-cols-3 gap-3">
      {stats.map(stat => (
        // The value shows above its label; screen readers keep label first
        <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-2xl bg-muted/60 p-3">
          <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
          <dd className="font-heading text-2xl font-black tracking-tight whitespace-nowrap tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
