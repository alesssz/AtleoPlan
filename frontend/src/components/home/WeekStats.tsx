/*
 * Three numbers of the current week on Home, under the week strip:
 * workouts done, sets logged and volume lifted (sets × reps × weight).
 * They are true today: zero, since no workout can be logged yet. When
 * workout mode exists (FEAT-3), Home will pass the real totals through the
 * props, and warm-up sets will not count (docs/02-decisions.md 2.8).
 */
import { useTranslation } from 'react-i18next'
import { formatNumber, formatWeight } from '@/lib/format'

/** Props of WeekStats: the week's totals. */
interface WeekStatsProps {
  /** Workouts completed this week. */
  workouts?: number
  /** Sets logged this week, warm-ups excluded. */
  sets?: number
  /** Volume this week in kg: the sum of reps × weight of every set. */
  volumeKg?: number
}

/**
 * Default values (`= 0`) apply when a prop is not passed: Home passes none
 * for now, so every number is 0.
 */
export function WeekStats({ workouts = 0, sets = 0, volumeKg = 0 }: WeekStatsProps) {
  const { t, i18n } = useTranslation()

  // The three tiles as data: a label and the already-formatted value
  // (numbers in the language's format: "1.250 kg" in Italian)
  const stats = [
    { label: t('home.statWorkouts'), value: formatNumber(workouts, i18n.language) },
    { label: t('home.statSets'), value: formatNumber(sets, i18n.language) },
    { label: t('home.statVolume'), value: formatWeight(volumeKg, i18n.language) },
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
          {/* The number: heavy, same-width digits (tabular-nums) */}
          <dd className="font-heading text-2xl font-black tracking-tight tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
