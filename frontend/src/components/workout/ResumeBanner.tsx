/*
 * The banner of a workout left in progress on this device, on Home and the
 * plan's page: Resume, or Finish and Delete from here.
 */
import { useQueryClient } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { finishWorkout } from './finish-workout'
import { FinishButton } from './FinishButton'
import { storeActiveSession } from './session-storage'
import { countSets, type ActiveSession } from './workout-session'

interface ResumeBannerProps {
  session: ActiveSession
  className?: string
  /**
   * Called once the workout is deleted from the banner: the page keeps the
   * workout it read in its state, and must drop it to hide the banner.
   */
  onDiscarded: () => void
}

export function ResumeBanner({ session, className, onDiscarded }: ResumeBannerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const [finishing, setFinishing] = useState(false)

  async function finish() {
    setFinishing(true)
    const id = await finishWorkout(session, user?.weight_unit ?? 'kg', queryClient)
    void navigate(`/session/${id}/summary`)
  }

  /** Nothing to undo on the server: a workout is sent only at Finish. */
  function discard() {
    storeActiveSession(null)
    onDiscarded()
  }

  return (
    // Lime-tinted: the one thing to do before starting anything else
    <div className={cn('flex flex-wrap items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-4', className)}>
      <p className="flex-1 basis-48 font-semibold">{t('workout.inProgress', { day: session.day_name ?? t('workout.free') })}</p>
      <div className="flex flex-wrap gap-3">
        {/* Outlined: Resume is the main action; Finish asks first */}
        <FinishButton count={countSets(session)} label={t('workout.done')} variant="outline" disabled={finishing} onFinish={() => void finish()} onDiscard={discard} />
        <Button asChild size="xl">
          <Link to={`/session/${session.id}`}>
            <Play aria-hidden="true" />
            {t('workout.resume')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
