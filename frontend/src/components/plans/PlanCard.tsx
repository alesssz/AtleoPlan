/*
 * One plan in the plan list: its name, its goal, how many days it has, when it
 * was last used ("Used 3 days ago", from its latest finished workout), and the
 * Active badge. The whole card is a link to the plan's page.
 *
 * Not here yet: the Shared badge (phase 2).
 */
import { CalendarDays, ChevronRight, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { PlanSummary } from '@/api/plans'
import { Badge } from '@/components/ui/badge'
import { formatDaysAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  /** The plan, as the list's API sends it. */
  plan: PlanSummary
}

export function PlanCard({ plan }: PlanCardProps) {
  const { t, i18n } = useTranslation()

  return (
    // The active plan's lime border stands out before its badge is read; the
    // badge says it in words too
    <Link
      to={`/plans/${plan.id}`}
      className={cn(
        'flex items-center gap-4 rounded-3xl border bg-card/60 p-5 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        plan.is_active && 'border-primary/60',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-heading text-lg font-extrabold tracking-tight">{plan.name}</h2>
          {plan.is_active && <Badge>{t('plans.active')}</Badge>}
        </div>
        {plan.goal && <p className="truncate text-sm text-muted-foreground">{plan.goal}</p>}
        {/* "3 days · Used 3 days ago" */}
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4" />
            {t('plans.days', { count: plan.days_count })}
          </span>
          {plan.last_used_at !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <History aria-hidden="true" className="size-4" />
              {plan.last_used_at === null
                ? t('plans.neverUsed')
                : t('plans.lastUsed', { when: formatDaysAgo(new Date(plan.last_used_at), new Date(), i18n.language) })}
            </span>
          )}
        </p>
      </div>

      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
