/*
 * The banner of a workout left in progress on this phone (paused with ✕, or
 * the app closed mid-workout), with Resume: on Home (docs/design/D1-ui.md
 * D1.4.2) and on the plan's page. One component, so both say the same
 * thing in the same way.
 */
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ActiveSession } from './workout-session'

/** Props of ResumeBanner. */
interface ResumeBannerProps {
  /** The workout in progress, as kept on the phone. */
  session: ActiveSession
  /** Extra classes, for the page's grid. */
  className?: string
}

/** "Workout in progress: Day A – Push", and Resume. */
export function ResumeBanner({ session, className }: ResumeBannerProps) {
  const { t } = useTranslation()

  return (
    // A lime-tinted box: the one thing to do before starting anything else.
    // flex-wrap: on a narrow phone Resume goes under the text
    <div className={cn('flex flex-wrap items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-4', className)}>
      {/* A free workout has no day's name: "Free workout" instead */}
      <p className="flex-1 font-semibold">{t('workout.inProgress', { day: session.day_name ?? t('workout.free') })}</p>
      {/* Button asChild + Link: a link that looks like a button (C1.8) */}
      <Button asChild size="xl">
        <Link to={`/session/${session.id}`}>
          <Play aria-hidden="true" />
          {t('workout.resume')}
        </Link>
      </Button>
    </div>
  )
}
