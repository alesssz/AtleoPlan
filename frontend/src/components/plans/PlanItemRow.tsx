/*
 * One exercise of a plan's day: its cover, its name linking to the exercise's
 * page, the line that sums up its sets ("4 × 8–10 · 80 kg · 90 s"), the
 * warm-ups counted apart ("+ 2 warm-up") and the user's notes. The line is
 * built by itemSummary() (plan-format.ts).
 */
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { PlanItem } from '@/api/plans'
import { itemSummary, warmUpCount } from '@/components/plans/plan-format'
import type { WeightUnit } from '@/lib/format'

interface PlanItemRowProps {
  /** The exercise of the plan, with its sets. */
  item: PlanItem
  /** The user's weight unit. */
  weightUnit: WeightUnit
  /** The user's rest, for an exercise that sets none, in seconds. */
  defaultRestSeconds: number
}

export function PlanItemRow({ item, weightUnit, defaultRestSeconds }: PlanItemRowProps) {
  const { t, i18n } = useTranslation()
  const cover = item.exercise.photos[0]
  const warmUps = warmUpCount(item.sets)

  return (
    <div className="flex gap-4 py-3">
      {cover
        ? <img src={cover.thumb_url} alt="" loading="lazy" className="size-12 shrink-0 rounded-xl bg-muted object-cover" />
        : (
            <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
              <Dumbbell className="size-5 text-muted-foreground" />
            </div>
          )}

      <div className="min-w-0 flex-1">
        <Link to={`/exercises/${item.exercise_id}`} className="font-semibold hover:text-primary">
          {item.exercise.name}
        </Link>
        {/* Tabular digits, so neighbouring lines line up */}
        <p className="text-sm text-muted-foreground tabular-nums">
          {itemSummary(item, { language: i18n.language, weightUnit, defaultRestSeconds, t })}
          {warmUps > 0 && <span className="ml-2 font-semibold text-foreground/80">{t('plans.detail.warmUps', { count: warmUps })}</span>}
        </p>
        {item.notes && <p className="mt-1 text-sm whitespace-pre-line italic">{item.notes}</p>}
      </div>
    </div>
  )
}
