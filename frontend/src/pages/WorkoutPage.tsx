/*
 * Workout mode's route, full screen outside the app's frame. The workout lives
 * on the device until Finish, so an address whose workout is not here
 * (another device, already finished) says so.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { loadActiveSession } from '@/components/workout/session-storage'
import { WorkoutScreen } from '@/components/workout/WorkoutScreen'

export function WorkoutPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [session] = useState(loadActiveSession)

  if (session === null || session.id !== id) {
    return (
      <main role="alert" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <p>{t('workout.notFound')}</p>
        <Link to="/plans" className="font-semibold text-primary">{t('workout.back')}</Link>
      </main>
    )
  }

  return <WorkoutScreen initial={session} />
}
