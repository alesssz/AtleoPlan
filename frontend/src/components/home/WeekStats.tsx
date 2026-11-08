/*
 * Three numbers of the current week on Home, under the week strip:
 * workouts done, sets logged (warm-ups excluded, D2.8) and minutes trained.
 * Home works them out from the recent workouts (week-summary.ts).
 *
 * Minutes, not volume (weight × reps): a week's volume adds up unlike
 * exercises and counts nothing done with the body alone
 * (src/components/history/compare.ts). Minutes, not "2 h 35 min": a
 * single number fits a third of a phone's width.
 */
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/format'

/** Props of WeekStats: the week's totals. */
interface WeekStatsProps {
  /** Workouts completed this week. */
  workouts?: number
  /** Sets logged this week, warm-ups excluded. */
  sets?: number
  /** Minutes trained this week, pauses left out. */
  minutes?: number
}

/**
 * Default values (`= 0`) apply when a prop is not passed: a week with no
 * workout shows zeros.
 */
export function WeekStats({ workouts = 0, sets = 0, minutes = 0 }: WeekStatsProps) {
  const { t, i18n } = useTranslation()

  // The three tiles as data: a label and the already-formatted value
  // (numbers in the language's format: "1.250 kg" in Italian)
  const stats = [
    { label: t('home.statWorkouts'), value: formatNumber(workouts, i18n.language) },
    { label: t('home.statSets'), value: formatNumber(sets, i18n.language) },
    { label: t('home.statMinutes'), value: formatNumber(minutes, i18n.language) },
  ]

  return (
    // A description list (<dl>): pairs of a term (<dt>, the label) and its
    // value (<dd>), which screen readers read as such. Three equal columns
    <dl className="grid grid-cols-3 gap-3">
      {stats.map(stat => (
        // Each tile: a quiet rounded box, label above, big number below.
        // flex-col-reverse draws the <dd> above the <dt> on screen while the
        // HTML keeps the right order for screen readers (label, then value)
        <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-2xl bg-muted/60 p-3">
          <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
          {/* The number: heavy, same-width digits (tabular-nums), never
              broken over two lines (whitespace-nowrap) */}
          <dd className="font-heading text-2xl font-black tracking-tight whitespace-nowrap tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
