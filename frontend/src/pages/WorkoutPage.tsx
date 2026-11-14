/*
 * Workout mode's page (route `/session/:id`): full screen, outside the app's
 * frame and its tab bar (src/router.tsx). It finds the workout on the phone
 * (session-storage.ts) and hands it to WorkoutScreen.
 *
 * The workout lives on the phone, not on the server, until Done: an address
 * whose workout is not here (another phone, a workout already finished)
 * says so.
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
