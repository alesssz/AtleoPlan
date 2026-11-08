/*
 * The workout against last time, in one line, above its exercises: "Against
 * last time: 3 better · 1 same · 1 lower · 2 new" (docs/design/D1-ui.md
 * D1.4.10). Only the verdicts that occur are written; nothing when no
 * exercise was done. The verdicts come from compare.ts.
 */
import { useTranslation } from 'react-i18next'
import type { VerdictCount } from './compare'

/** Props of ComparisonSummary. */
interface ComparisonSummaryProps {
  /** How many exercises got each verdict (countVerdicts). */
  count: VerdictCount
}

/** One sentence; the better ones in lime. */
export function ComparisonSummary({ count }: ComparisonSummaryProps) {
  const { t } = useTranslation()
  // The parts, in order, only those that occur: "3 better", "1 same"…
  const parts = [
    count.better > 0 ? t('compare.countBetter', { count: count.better }) : null,
    count.same > 0 ? t('compare.countSame', { count: count.same }) : null,
    count.worse > 0 ? t('compare.countWorse', { count: count.worse }) : null,
    count.first > 0 ? t('compare.countFirst', { count: count.first }) : null,
  ].filter(part => part !== null)
  if (parts.length === 0) return null

  return (
    <p className="font-semibold">
      <span className="text-muted-foreground">{t('compare.title')}</span>
      {' '}
      {/* More better than lower: the sentence in lime */}
      <span className={count.better > count.worse ? 'text-primary' : undefined}>{parts.join(' · ')}</span>
    </p>
  )
}
