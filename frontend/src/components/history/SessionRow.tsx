/*
 * One past workout in a list (history, and the latest on Progress): its date,
 * the day done or "Free workout", the plan, and the time, sets and reps. The
 * whole row is a link to the workout's page.
 */
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { WorkoutSession } from '@/api/sessions'
import { formatDayParts, formatDuration } from '@/lib/format'
import { sessionTotals } from './totals'

interface SessionRowProps {
  /** The workout, with its totals. */
  session: WorkoutSession
}

export function SessionRow({ session }: SessionRowProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { weekday, day } = formatDayParts(new Date(session.started_at), language)
  const totals = sessionTotals(session)
  const numbers = [
    totals.durationSeconds === null ? null : formatDuration(totals.durationSeconds, language),
    t('history.sets', { count: totals.sets }),
    t('history.reps', { count: totals.reps }),
  ].filter(part => part !== null).join(' · ')

  return (
    <Link to={`/progress/history/${session.id}`} className="group flex items-center gap-4 rounded-2xl border bg-card/60 p-4 transition-colors hover:bg-muted/60">
      <div className="grid size-14 shrink-0 place-content-center rounded-xl bg-muted text-center">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{weekday}</span>
        <span className="font-heading text-xl leading-none font-black tabular-nums">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{session.day_name ?? t('workout.free')}</p>
        {session.plan_name && <p className="truncate text-sm text-muted-foreground">{session.plan_name}</p>}
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">{numbers}</p>
      </div>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
