/*
 * Workout mode (docs/design/D1-ui.md D1.4.9), used as a person would: a set
 * ticked, the rest timer, Next, pause with ✕, Finish sending the workout and
 * opening its summary,
 * early or from the last exercise, a workout kept on the phone when the
 * network is down, and a free workout, whose exercises are added on the way.
 */
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { loadActiveSession, loadFinished, loadPending, storeActiveSession } from '@/components/workout/session-storage'
import { startFreeSession, startSession } from '@/components/workout/workout-session'
import { fakeApi, renderRoutes, sentBody, signedInAs } from '@/test/auth-helpers'
import { exercisePage, testExercise } from '@/test/exercise-helpers'
import { testPlan } from '@/test/plan-helpers'
import { WorkoutPage } from './WorkoutPage'

/** The page, and a stand-in for the plan's page it returns to. */
const routes = [
  { path: 'session/:id', element: <WorkoutPage /> },
  { path: 'plans/:id', element: <p>the plan page</p> },
  { path: 'session/:id/summary', element: <p>the summary</p> },
  { path: '/', element: <p>home</p> },
]

/** Day A of the test plan, started now and kept on the phone, as Start does. */
function startDayA() {
  const plan = testPlan()
  const session = startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [], language: 'en', now: new Date() })
  storeActiveSession(session)
  return session
}

describe('WorkoutPage', () => {
  it('shows the first exercise with its sets, filled with the targets, under their column titles', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    expect(await screen.findByRole('heading', { level: 2, name: 'Barbell Bench Press' })).toBeInTheDocument()
    expect(screen.getByText('Exercise 1 of 3')).toBeInTheDocument()
    // A title above each column: Set, Last, kg, Reps
    for (const title of ['Set', 'Last', 'kg', 'Reps']) expect(screen.getByText(title)).toBeInTheDocument()
    // Two warm-ups, then the sets that count, numbered from 1
    expect(screen.getByLabelText('Warm-up 2, kg')).toHaveValue('40')
    expect(screen.getByLabelText('Set 1, kg')).toHaveValue('80')
    expect(screen.getByLabelText('Set 1, Reps')).toHaveValue('8')
    expect(screen.getByRole('button', { name: 'Set 1, normal: tap to change the type' })).toHaveTextContent('1')
  })

  it('ticks a set, which starts the rest timer, and keeps it on the phone', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Tick: Set 1' }))

    expect(screen.getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    const rest = screen.getByRole('region', { name: 'Rest' })
    expect(within(rest).getByRole('timer')).toHaveTextContent('1:30')
    // Written to the phone at once
    expect(loadActiveSession()?.exercises[0]?.sets[2]?.done).toBe(true)

    await userEvent.click(within(rest).getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('region', { name: 'Rest' })).not.toBeInTheDocument()
  })

  it('goes to the next exercise, and to any one through its dot; in a superset, Next names the other exercise', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Bent Over Barbell Row' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Exercise 3: Pullups' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Pullups' })).toBeInTheDocument()
    // In a superset with the rows: said under its name
    expect(screen.getByText('Superset: Bent Over Barbell Row + Pullups')).toBeInTheDocument()
    // A bodyweight exercise: reps, and an added weight that may stay empty
    expect(screen.getByText('+kg')).toBeInTheDocument()
    expect(screen.getByLabelText('Set 1, added weight, kg')).toHaveValue('')

    // The last exercise, but the rows have sets left: the bottom bar names
    // them, instead of Finish workout
    expect(screen.queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument()
    const toRows = screen.getByRole('button', { name: 'Next: Bent Over Barbell Row' })
    // A set ticked: the screen stays on the pull-ups, the set in sight, and
    // the round's rest starts
    await userEvent.type(screen.getByLabelText('Set 1, Reps'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Tick: Set 1' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Pullups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: 'Rest' })).toBeInTheDocument()
    // The rows, with a tap
    await userEvent.click(toRows)
    expect(screen.getByRole('heading', { level: 2, name: 'Bent Over Barbell Row' })).toBeInTheDocument()
  })

  it('offers to finish at the bottom once every set is ticked, on any exercise', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    // The first exercise: Next at the bottom
    expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument()
    // Every set ticked, on the phone as after a whole workout, then drawn again
    const all = startDayA()
    for (const item of all.exercises) for (const set of item.sets) set.done = true
    storeActiveSession(all)
    cleanup()
    renderRoutes(routes, `/session/${all.id}`)

    expect(await screen.findByRole('button', { name: 'Finish workout' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  it('pauses with ✕ and goes back to the plan, the workout kept', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Pause and leave' }))

    expect(router.state.location.pathname).toBe('/plans/plan-ppl')
    expect(loadActiveSession()?.running_since).toBeNull()
  })

  it('finishes early: says what will not be saved, sends the workout, opens its summary', async () => {
    const session = startDayA()
    const fake = fakeApi({ 'GET /api/user': signedInAs(), [`PUT /api/sessions/${session.id}`]: { status: 201, body: { data: { id: session.id } } } })
    const { router } = renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Tick: Set 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Finish the workout?' })
    expect(dialog).toHaveTextContent('1 of 7 sets done, warm-ups excluded. The 6 sets not ticked will not be saved.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Finish and save' }))

    expect(await screen.findByText('the summary')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/session/${session.id}/summary`)
    const body = sentBody(fake, `/api/sessions/${session.id}`) as SessionInput
    expect(body.finished_at).not.toBeNull()
    expect(body.exercises[0]?.sets).toHaveLength(1)
    // No workout in progress, nothing waiting; the finished one kept for
    // the summary, saved
    expect(loadActiveSession()).toBeNull()
    expect(loadPending()).toEqual({})
    expect(loadFinished()).toMatchObject({ id: session.id, outcome: 'saved' })
  })

  it('keeps a finished workout on the phone when the network is down', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs(), [`PUT /api/sessions/${session.id}`]: 'network' })
    renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Finish and save' }))

    expect(await screen.findByText('the summary')).toBeInTheDocument()
    expect(loadFinished()?.outcome).toBe('queued')
    expect(Object.keys(loadPending())).toEqual([session.id])
  })

  it('starts a free workout empty, adds exercises from the library with last time\'s sets', async () => {
    const session = startFreeSession(new Date())
    storeActiveSession(session)
    const lastSquat = { exercise_id: 40, session_id: 'old', started_at: '2026-11-02T18:00:00Z', sets: [{ id: 'old-1', set_type: 'normal', weight_kg: '100.000', reps: 5, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' }] }
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/exercises': exercisePage([testExercise(), testExercise({ id: 40, name: 'Barbell Squat', photos: [] })]),
      'GET /api/sessions/last-sets': { status: 200, body: { data: [lastSquat] } },
    })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // Nothing to do yet but add: no Finish, no Previous or Next
    expect(await screen.findByRole('heading', { level: 1, name: 'Free workout' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No exercises yet' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument()

    // The library's picker, as in the plan editor
    await user.click(screen.getByRole('button', { name: 'Add exercises' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add exercises' })
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Choose Barbell Squat' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add (1)' }))

    // The squat, filled with last time's 100 × 5, kept on the phone
    expect(await screen.findByRole('heading', { level: 2, name: 'Barbell Squat' })).toBeInTheDocument()
    expect(screen.getByLabelText('Set 1, kg')).toHaveValue('100')
    expect(screen.getByLabelText('Set 1, Reps')).toHaveValue('5')
    expect(loadActiveSession()?.exercises).toHaveLength(1)
  })

  it('cancels an empty free workout, keeping nothing', async () => {
    const session = startFreeSession(new Date())
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel workout' }))

    expect(router.state.location.pathname).toBe('/')
    expect(loadActiveSession()).toBeNull()
    expect(loadPending()).toEqual({})
  })

  it('says so for a workout that is not on this phone', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, '/session/0192f4a7-0000-7000-8000-000000000000')

    expect(await screen.findByRole('alert')).toHaveTextContent('This workout is not on this device.')
  })
})
