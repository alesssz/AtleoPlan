/*
 * The active plan's card on Home (docs/design/D1-ui.md D1.4.2): the plan's
 * name, the day chosen in large type with its number of exercises and an
 * estimated duration, Start, and a chip for each day of the plan.
 *
 * - **The suggested day** is chosen at first: the day after the last one
 *   done (the backend works it out, D2.8). The card says so ("Suggested")
 *   and says which day was done last.
 * - **A chip** chooses another day: the card then shows that one, and
 *   Start starts it. One tap chooses, a second starts: a tap that started a
 *   workout at once would be too easy to make by mistake on a phone, and a
 *   workout started by mistake stays in progress until it is finished.
 * - **Start** is disabled while another workout is in progress on the
 *   phone, with the reason (the banner above offers Resume), and for a day
 *   with no exercises.
 *
 * The card shows; Home starts (useStartWorkout), so the card stays simple
 * to read and to test.
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

/** Props of ActivePlanCard. */
interface ActivePlanCardProps {
  /** The active plan (not null: Home shows the empty state otherwise). */
  plan: PlanSummary
  /** Home's answer: the days, the suggested day, the day done last. */
  home: HomeData
  /** True when a workout is already in progress on this phone. */
  busy: boolean
  /** True from the tap on Start until workout mode opens: Start shows its spinner. */
  starting: boolean
  /** True when the plan could not be read to start (offline). */
  failed: boolean
  /**
   * Called by Start with the day chosen.
   * @param dayId the day's UUID
   */
  onStart: (dayId: string) => void
  /** Extra classes, for Home's grid. */
  className?: string
}

/** The active plan, the day to do, and Start. */
export function ActivePlanCard({ plan, home, busy, starting, failed, onStart, className }: ActivePlanCardProps) {
  const { t } = useTranslation()
  // The day chosen: the suggested one at first, the first day without a
  // suggestion. useState's starting value is read on the first draw only;
  // later, a chip changes it
  const [chosenId, setChosenId] = useState(home.suggested_day_id ?? home.days[0]?.id ?? null)
  // The chosen day's entry; the first day when the chosen one has gone
  // (the plan changed and Home was read again)
  const day = home.days.find(candidate => candidate.id === chosenId) ?? home.days[0]
  // Whether the day on the card is the one the app suggests
  const suggested = day !== undefined && day.id === home.suggested_day_id
  // The day done last, by its name at the time; null when none was done
  const lastName = home.last_day?.name ?? null

  return (
    // The card: the gradient border, as the empty state it replaces.
    // aria-labelledby: the section is named after the plan
    <section aria-labelledby="active-plan-title" className={cn('border-glow flex flex-col rounded-3xl p-6 sm:p-8', className)}>
      {/* The plan: a small lime eyebrow, then its name, a link to its page */}
      <p className="mb-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">{t('home.activePlan')}</p>
      <h2 id="active-plan-title" className="font-heading text-lg font-extrabold tracking-tight">
        <Link to={`/plans/${plan.id}`} className="hover:underline">{plan.name}</Link>
      </h2>

      {day === undefined
        ? (
            // A plan with no days: nothing to start; the editor adds them
            <div className="mt-6 flex flex-col items-start gap-4">
              <p className="text-muted-foreground">{t('home.noDays')}</p>
              <Button asChild variant="outline" size="xl">
                <Link to={`/plans/${plan.id}/edit`}>{t('home.editPlan')}</Link>
              </Button>
            </div>
          )
        : (
            <>
              {/* The day chosen, large: "Suggested" when it is the
                  suggestion, its name, then what it holds */}
              <div className="mt-6">
                {suggested && <Badge className="mb-3">{t('home.suggested')}</Badge>}
                <p className="font-heading text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl">{day.name}</p>
                {/* "5 exercises · about 36 min", each with its icon */}
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
                {/* "Last time you did Day A – Push" */}
                {lastName && <p className="mt-1 text-sm text-muted-foreground">{t('home.lastTime', { day: lastName })}</p>}
              </div>

              {/* Start, lime and large: the one main action of Home.
                  disabled says why it cannot start; pending, with its
                  spinner, that it is starting (the plan being read, C1.20) */}
              <div className="mt-6 flex flex-col items-start gap-2">
                <Button size="xl" className="px-6" disabled={busy || day.exercises === 0} pending={starting} onClick={() => onStart(day.id)}>
                  <Play aria-hidden="true" />
                  {t('home.start')}
                </Button>
                {busy && <p className="text-sm text-muted-foreground">{t('workout.busy')}</p>}
                {failed && <p role="alert" className="text-sm text-destructive">{t('home.startError')}</p>}
              </div>

              {/* A chip per day, when there is more than one: a tap chooses
                  it. aria-pressed tells screen readers which one is chosen;
                  on screen, a lime border and tint. The outline button has
                  its own dark-theme colours (dark:border-input…), so the
                  chosen look repeats them with dark: to win there too.
                  48 px tall (min-h-12), the smallest a finger hits reliably */}
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
