/*
 * The active plan's card on Home. A day chip only chooses and Start starts:
 * a workout started by a stray tap stays in progress until it is finished.
 */
import { Clock, Dumbbell, Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { HomeData } from '@/api/home'
import type { PlanSummary } from '@/api/plans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActivePlanCardProps {
  plan: PlanSummary
  home: HomeData
  /** True when a workout is already in progress on this phone. */
  busy: boolean
  /** From the tap on Start until workout mode opens. */
  starting: boolean
  /** True when the plan could not be read to start (offline). */
  failed: boolean
  onStart: (dayId: string) => void
  className?: string
}

export function ActivePlanCard({ plan, home, busy, starting, failed, onStart, className }: ActivePlanCardProps) {
  const { t } = useTranslation()
  const [chosenId, setChosenId] = useState(home.suggested_day_id ?? home.days[0]?.id ?? null)
  // The first day when the chosen one has gone (the plan changed meanwhile)
  const day = home.days.find(candidate => candidate.id === chosenId) ?? home.days[0]
  const suggested = day !== undefined && day.id === home.suggested_day_id
  const lastName = home.last_day?.name ?? null

  return (
    <section aria-labelledby="active-plan-title" className={cn('border-glow flex flex-col rounded-3xl p-6 sm:p-8', className)}>
      <p className="mb-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">{t('home.activePlan')}</p>
      <h2 id="active-plan-title" className="font-heading text-lg font-extrabold tracking-tight">
        <Link to={`/plans/${plan.id}`} className="hover:underline">{plan.name}</Link>
      </h2>

      {day === undefined
        ? (
            <div className="mt-6 flex flex-col items-start gap-4">
              <p className="text-muted-foreground">{t('home.noDays')}</p>
              <Button asChild variant="outline" size="xl">
                <Link to={`/plans/${plan.id}/edit`}>{t('home.editPlan')}</Link>
              </Button>
            </div>
          )
        : (
            <>
              <div className="mt-6">
                {suggested && <Badge className="mb-3">{t('home.suggested')}</Badge>}
                <p className="font-heading text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl">{day.name}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Dumbbell aria-hidden="true" className="size-4" />
                    {t('home.exercises', { count: day.exercises })}
                  </span>
                  {day.estimated_minutes > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="size-4" />
                      {t('home.minutes', { count: day.estimated_minutes })}
                    </span>
                  )}
                </p>
                {lastName && <p className="mt-1 text-sm text-muted-foreground">{t('home.lastTime', { day: lastName })}</p>}
              </div>

              <div className="mt-6 flex flex-col items-start gap-2">
                <Button size="xl" className="px-6" disabled={busy || day.exercises === 0} pending={starting} onClick={() => onStart(day.id)}>
                  <Play aria-hidden="true" />
                  {t('home.start')}
                </Button>
                {busy && <p className="text-sm text-muted-foreground">{t('workout.busy')}</p>}
                {failed && <p role="alert" className="text-sm text-destructive">{t('home.startError')}</p>}
              </div>

              {/* The chosen look repeats its classes with dark:, or the
                  outline button's dark-theme colours would win */}
              {home.days.length > 1 && (
                <div className="mt-8">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t('home.otherDays')}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {home.days.map(entry => (
                      <li key={entry.id}>
                        <Button
                          variant="outline"
                          aria-pressed={entry.id === day.id}
                          onClick={() => setChosenId(entry.id)}
                          className={cn('min-h-12 rounded-full px-4', entry.id === day.id && 'border-primary bg-primary/15 text-foreground dark:border-primary dark:bg-primary/15')}
                        >
                          {entry.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
    </section>
  )
}
