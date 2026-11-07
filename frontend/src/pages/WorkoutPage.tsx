/*
 * Workout mode's page (route `/session/:id`, docs/design/D1-ui.md D1.4.9):
 * full screen, outside the app's frame and its tab bar (src/router.tsx). It
 * finds the workout on the phone (session-storage.ts) and hands it to
 * WorkoutScreen, which does the rest. How it was built:
 * docs/how-to/H3-frontend.md H3.15.
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

/** The workout page (route `/session/:id`). */
export function WorkoutPage() {
  const { t } = useTranslation()
  // The :id of the address
  const { id } = useParams()
  // The workout kept on the phone, read once, when the page opens
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
