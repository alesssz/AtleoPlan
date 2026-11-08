/*
 * The four numbers of a finished workout, as tiles: time trained, exercises,
 * sets and reps (docs/design/D1-ui.md D1.4.10). Shown by the summary and
 * by a workout's page in history; the numbers come from totals.ts. Same
 * look as Home's week numbers (src/components/home/WeekStats.tsx).
 */
import { useTranslation } from 'react-i18next'
import { formatDuration, formatNumber } from '@/lib/format'
import type { Totals } from './totals'

/** Props of WorkoutStats. */
interface WorkoutStatsProps {
  /** The workout's numbers. */
  totals: Totals
}

/** Four tiles: two by two on a phone, in one row from 640 px. */
export function WorkoutStats({ totals }: WorkoutStatsProps) {
  const { t, i18n } = useTranslation()
  // The interface's language, for the numbers and the units
  const language = i18n.language

  // The tiles as data: a label and the value, already written out
  const stats = [
    // A dash when the time is unknown (a workout sent by an older app)
    { label: t('history.statDuration'), value: totals.durationSeconds === null ? '–' : formatDuration(totals.durationSeconds, language) },
    { label: t('history.statExercises'), value: formatNumber(totals.exercises, language) },
    { label: t('history.statSets'), value: formatNumber(totals.sets, language) },
    // Reps, the body alone included: unlike the volume, they count pull-ups
    { label: t('history.statReps'), value: formatNumber(totals.reps, language) },
  ]

  return (
    // A description list (<dl>): label (<dt>) and value (<dd>) pairs, which
    // screen readers read as such. flex-col-reverse draws the value above
    // its label while the HTML keeps the label first
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(stat => (
        <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-2xl bg-muted/60 p-4">
          <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
          {/* Heavy, same-width digits, on one line */}
          <dd className="font-heading text-2xl font-black tracking-tight whitespace-nowrap tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
