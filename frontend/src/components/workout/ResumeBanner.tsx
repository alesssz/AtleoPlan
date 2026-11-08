/*
 * The banner of a workout left in progress on this phone (paused with ✕, or
 * the app closed mid-workout): on Home (docs/design/D1-ui.md D1.4.2) and on
 * the plan's page. One component, so both say the same thing in the same
 * way, with two actions:
 *
 * - **Resume**, lime: back into workout mode;
 * - **Finish**, outlined: finishes it from here, with the same question as
 *   in workout mode (FinishButton) and the same steps (finishWorkout), then
 *   opens its summary. For a workout done but never finished: the app
 *   closed at the end, the phone in the bag.
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
import { countSets, type ActiveSession } from './workout-session'

/** Props of ResumeBanner. */
interface ResumeBannerProps {
  /** The workout in progress, as kept on the phone. */
  session: ActiveSession
  /** Extra classes, for the page's grid. */
  className?: string
}

/** "Workout in progress: Day A – Push", Finish and Resume. */
export function ResumeBanner({ session, className }: ResumeBannerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // The user's unit, for the weights sent in kilograms
  const { data: user } = useCurrentUser()
  // True while Finish runs: the request may take a moment
  const [finishing, setFinishing] = useState(false)

  /** Finish, confirmed: finished, queued, sent, then its summary. */
  async function finish() {
    setFinishing(true)
    const id = await finishWorkout(session, user?.weight_unit ?? 'kg', queryClient)
    void navigate(`/session/${id}/summary`)
  }

  return (
    // A lime-tinted box: the one thing to do before starting anything else.
    // flex-wrap: on a narrow phone the buttons go under the text
    <div className={cn('flex flex-wrap items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-4', className)}>
      {/* A free workout has no day's name: "Free workout" instead */}
      <p className="flex-1 basis-48 font-semibold">{t('workout.inProgress', { day: session.day_name ?? t('workout.free') })}</p>
      <div className="flex flex-wrap gap-3">
        {/* Outlined: Resume is the main action; Finish asks first */}
        <FinishButton count={countSets(session)} label={t('workout.done')} variant="outline" disabled={finishing} onFinish={() => void finish()} />
        {/* Button asChild + Link: a link that looks like a button (C1.8) */}
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
