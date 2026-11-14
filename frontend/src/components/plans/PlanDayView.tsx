/*
 * The content of one day of a plan, the panel under its tab: how many exercises
 * and sets it has, then the exercises in order, the supersets joined by a
 * coloured bar on the side.
 */
import { useTranslation } from 'react-i18next'
import type { PlanDay } from '@/api/plans'
import { groupSupersets, workingSets } from '@/components/plans/plan-format'
import { PlanItemRow } from '@/components/plans/PlanItemRow'
import type { WeightUnit } from '@/lib/format'

interface PlanDayViewProps {
  /** The day, with its exercises and sets. */
  day: PlanDay
  /** The user's weight unit. */
  weightUnit: WeightUnit
  /** The user's rest, for an exercise that sets none, in seconds. */
  defaultRestSeconds: number
}

export function PlanDayView({ day, weightUnit, defaultRestSeconds }: PlanDayViewProps) {
  const { t } = useTranslation()

  if (day.items.length === 0) {
    return <p className="py-6 text-muted-foreground">{t('plans.detail.noItems')}</p>
  }

  // Warm-ups left out
  const sets = day.items.reduce((total, item) => total + workingSets(item.sets).length, 0)
  const rowProps = { weightUnit, defaultRestSeconds }

  return (
    <div>
      {/* "3 exercises · 7 sets" */}
      <p className="mb-2 text-sm text-muted-foreground">
        {t('plans.detail.exercises', { count: day.items.length })}
        {' · '}
        {t('plans.detail.sets', { count: sets })}
      </p>

      {/* A superset is one <li> holding its exercises, with a lime bar */}
      <ul className="divide-y">
        {groupSupersets(day.items).map(block => (
          <li key={block.items[0]?.id}>
            {block.group === null
              ? block.items.map(item => <PlanItemRow key={item.id} item={item} {...rowProps} />)
              : (
                  // Named for screen readers, which cannot see the bar
                  <section aria-label={t('plans.detail.superset')} className="my-2 border-l-4 border-primary pl-3">
                    <p className="pt-2 text-xs font-bold tracking-wider text-primary uppercase">{t('plans.detail.superset')}</p>
                    {block.items.map(item => <PlanItemRow key={item.id} item={item} {...rowProps} />)}
                  </section>
                )}
          </li>
        ))}
      </ul>
    </div>
  )
}
