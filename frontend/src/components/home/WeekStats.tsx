/*
 * Three numbers of the current week on Home, under the week strip:
 * workouts done, sets logged and volume lifted (weight × reps), warm-up
 * sets excluded (docs/design/D2-decisions.md D2.8). Home works them out
 * from the recent workouts (week-summary.ts); the volume is shown in the
 * user's unit.
 */
import { useTranslation } from 'react-i18next'
import { weightIn } from '@/components/plans/plan-format'
import { formatNumber, type WeightUnit } from '@/lib/format'

/** Props of WeekStats: the week's totals. */
interface WeekStatsProps {
  /** Workouts completed this week. */
  workouts?: number
  /** Sets logged this week, warm-ups excluded. */
  sets?: number
  /** Volume this week in kg: the sum of reps × weight of every set. */
  volumeKg?: number
  /** The user's weight unit, for the volume; kg by default. */
  unit?: WeightUnit
}

/**
 * Default values (`= 0`) apply when a prop is not passed: a week with no
 * workout shows zeros.
 */
export function WeekStats({ workouts = 0, sets = 0, volumeKg = 0, unit = 'kg' }: WeekStatsProps) {
  const { t, i18n } = useTranslation()

  // The three tiles as data: a label and the already-formatted value
  // (numbers in the language's format: "1.250 kg" in Italian)
  const stats = [
    { label: t('home.statWorkouts'), value: formatNumber(workouts, i18n.language) },
    { label: t('home.statSets'), value: formatNumber(sets, i18n.language) },
    // In the user's unit, without decimals, the unit in the label: "12.480"
    // under "Volume (kg)". With the unit beside it, a week's volume did
    // not fit a third of a phone's width and went over two lines
    { label: t('home.statVolume', { unit }), value: formatNumber(Math.round(weightIn(volumeKg, unit)), i18n.language) },
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
