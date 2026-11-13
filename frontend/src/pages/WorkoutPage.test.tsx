/*
 * Workout mode (docs/design/D1-ui.md D1.4.9), used as a person would: a set
 * ticked, the rest timer, Next, pause with ✕, Finish sending the workout and
 * opening its summary,
 * early or from the last exercise, a workout kept on the phone when the
 * network is down, and a free workout, whose exercises are added on the way.
 * Then what came after a real workout (docs/how-to/H3-frontend.md H3.32):
 * the stopwatch docked under the sets, with Pause; a time past a minute
 * written as a clock; the exercise up next, a reminder; "How to do it";
 * removing a set or an exercise added by hand, never the plan's; and
 * deleting the workout in progress from Finish's dialog.
 */
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { loadActiveSession, loadFinished, loadPending, storeActiveSession } from '@/components/workout/session-storage'
import { exerciseFrom, startFreeSession, startSession } from '@/components/workout/workout-session'
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
    // Add set closes the table; Add exercises is the ＋ after the dots,
    // in the navigation between exercises
    expect(screen.getByRole('button', { name: 'Add set' })).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Exercise 1 of 3' })).getByRole('button', { name: 'Add exercises' })).toBeInTheDocument()
    // Two warm-ups, then the sets that count, numbered from 1
    // Each value is a button that opens the stepper, named with its value
    expect(screen.getByRole('button', { name: 'Warm-up 2, kg: 40' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, kg: 80' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Reps: 8' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Set 1, normal: change the type' })).toHaveTextContent('1')
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
    expect(screen.getByRole('button', { name: 'Set 1, added weight, kg: empty' })).toBeInTheDocument()

    // The last exercise, but the rows have sets left: the bottom bar names
    // them, instead of Finish workout
    expect(screen.queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument()
    const toRows = screen.getByRole('button', { name: 'Next: Bent Over Barbell Row' })
    // A set ticked: the screen stays on the pull-ups, the set in sight, and
    // the round's rest starts
    // The reps typed in the stepper's box, then Done
    await userEvent.click(screen.getByRole('button', { name: 'Set 1, Reps: empty' }))
    await userEvent.type(within(await screen.findByRole('dialog', { name: 'Set 1' })).getByLabelText('Set 1, Reps'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
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

  it('deletes the workout in progress from Finish\'s dialog, after a second question, sending nothing', async () => {
    const session = startDayA()
    const fake = fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, `/session/${session.id}`)

    // A set ticked: it goes too
    await userEvent.click(await screen.findByRole('button', { name: 'Tick: Set 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))
    await userEvent.click(within(await screen.findByRole('alertdialog', { name: 'Finish the workout?' })).getByRole('button', { name: 'Delete workout' }))

    // The second question; Back returns to the first, the dialog still open
    const second = screen.getByRole('alertdialog', { name: 'Delete the workout in progress?' })
    expect(second).toHaveTextContent('Nothing of it will be saved, not even the sets already ticked.')
    await userEvent.click(within(second).getByRole('button', { name: 'Back' }))
    await userEvent.click(within(screen.getByRole('alertdialog', { name: 'Finish the workout?' })).getByRole('button', { name: 'Delete workout' }))
    await userEvent.click(within(screen.getByRole('alertdialog', { name: 'Delete the workout in progress?' })).getByRole('button', { name: 'Delete' }))

    // Back to the plan's page; nothing on the phone, nothing waiting, no request
    expect(await screen.findByText('the plan page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans/plan-ppl')
    expect(loadActiveSession()).toBeNull()
    expect(loadPending()).toEqual({})
    expect(loadFinished()).toBeNull()
    expect(fake.mock.calls.some(([path]) => path.startsWith('/api/sessions'))).toBe(false)
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
    expect(screen.getByRole('button', { name: 'Set 1, kg: 100' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Reps: 5' })).toBeInTheDocument()
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

  it('changes a set\'s values with the big stepper, by the user\'s weight step', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // A tap on the weight opens the panel of that set, the weight's + ready
    await user.click(await screen.findByRole('button', { name: 'Set 1, kg: 80' }))
    const panel = await screen.findByRole('dialog', { name: 'Set 1' })
    expect(within(panel).getByRole('button', { name: 'kg: 2.5 more' })).toHaveFocus()
    // +2.5 twice, −1 rep: the values change at once
    await user.click(within(panel).getByRole('button', { name: 'kg: 2.5 more' }))
    await user.click(within(panel).getByRole('button', { name: 'kg: 2.5 more' }))
    await user.click(within(panel).getByRole('button', { name: 'Reps: 1 less' }))
    expect(within(panel).getByLabelText('Set 1, kg')).toHaveValue('85')
    expect(within(panel).getByLabelText('Set 1, Reps')).toHaveValue('7')

    // Done closes; the row shows the new values, kept on the phone
    await user.click(within(panel).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, kg: 85' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Reps: 7' })).toBeInTheDocument()
    expect(loadActiveSession()?.exercises[0]?.sets[2]).toMatchObject({ weight: '85', reps: '7' })
  })

  it('offers a note, Skip and Swap in the exercise\'s menu', async () => {
    const session = startDayA()
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/exercises': exercisePage([testExercise(), testExercise({ id: 50, name: 'Dumbbell Bench Press', photos: [] })]),
      'GET /api/sessions/last-sets': { status: 200, body: { data: [] } },
    })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()
    // The menu's button, beside the exercise's name
    const openMenu = async (name: string) => {
      await user.click(await screen.findByRole('button', { name: `Options for ${name}` }))
      return screen.findByRole('dialog', { name })
    }

    // A note: written in the panel, shown under the name
    await user.click(within(await openMenu('Barbell Bench Press')).getByRole('button', { name: 'Add a note' }))
    await user.type(screen.getByLabelText('Note on this exercise'), 'Seat on 4')
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    expect(screen.getByText('Seat on 4')).toBeInTheDocument()
    expect(loadActiveSession()?.exercises[0]?.notes).toBe('Seat on 4')

    // Skip: the next exercise opens; the dot says it was skipped; back on
    // it, a line says so, with the way back
    await user.click(within(await openMenu('Barbell Bench Press')).getByRole('button', { name: 'Skip exercise' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Bent Over Barbell Row' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Exercise 1: Barbell Bench Press, skipped' }))
    expect(screen.getByText('Skipped: the sets not ticked will not be saved.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Do it after all' }))
    expect(screen.queryByText(/^Skipped/)).not.toBeInTheDocument()

    // Swap: the picker, filtered by the main muscle, without the bench
    // press itself; one tap swaps
    await user.click(within(await openMenu('Barbell Bench Press')).getByRole('button', { name: 'Swap exercise' }))
    const picker = await screen.findByRole('dialog', { name: 'Swap exercise' })
    expect(within(picker).getByRole('button', { name: 'Only Chest' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(await within(picker).findByRole('button', { name: 'Dumbbell Bench Press' }))
    expect(within(picker).queryByRole('button', { name: 'Barbell Bench Press' })).not.toBeInTheDocument()
    expect(fake.mock.calls.some(([path]) => path.startsWith('/api/exercises?') && decodeURIComponent(path).includes('filter[muscle]=chest'))).toBe(true)
    // In its place, the same sets: the plan's reps, not its 80 kg, meant
    // for the barbell; the note, about the old exercise, gone
    expect(await screen.findByRole('heading', { level: 2, name: 'Dumbbell Bench Press' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, kg: empty' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Reps: 8' })).toBeInTheDocument()
    expect(screen.queryByText('Seat on 4')).not.toBeInTheDocument()

    // A set ticked: no more swapping, and the menu says why
    await user.click(screen.getByRole('button', { name: 'Tick: Warm-up 1' }))
    const menu = await openMenu('Dumbbell Bench Press')
    expect(within(menu).getByRole('button', { name: 'Swap exercise' })).toBeDisabled()
    expect(within(menu).getByText('Only before its first set is ticked.')).toBeInTheDocument()
  })

  it('times a hold with the stopwatch, which fills the set and ticks it', async () => {
    // A free workout with a dead hang; last time 45 seconds, which fills the set
    const lastHang = { exercise_id: 90, session_id: 'session-old', started_at: '2026-11-02T18:00:00Z', sets: [{ id: 'old-1', set_type: 'normal' as const, weight_kg: null, reps: null, duration_seconds: 45, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' }] }
    const session = startFreeSession(new Date())
    session.exercises = [exerciseFrom(testExercise({ id: 90, name: 'Dead Hang', logging_type: 'time' }), [lastHang], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })]
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // The time's column: "Time", the value in seconds for screen readers,
    // as people read it on screen
    expect(await screen.findByText('Time')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 45' })).toHaveTextContent('45 sec')

    await user.click(screen.getByRole('button', { name: 'Start the stopwatch: Set 1' }))

    // Docked under the sets, not over them: the exercise, the time from 0,
    // the target and last time; the table still there for screen readers
    // too (a dialog would hide it), the set timed marked, every ▶ off
    const panel = screen.getByRole('region', { name: 'Stopwatch' })
    expect(within(panel).getByText(/Dead Hang/)).toBeInTheDocument()
    expect(within(panel).getByRole('timer')).toHaveTextContent('0:00')
    expect(within(panel).getByText('Target 0:45')).toBeInTheDocument()
    expect(within(panel).getByText('Last time 0:45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tick: Set 1' }).closest('li')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Start the stopwatch: Set 1' })).toBeDisabled()
    // Stop has the focus: the ▶ tapped is disabled
    expect(within(panel).getByRole('button', { name: 'Stop' })).toHaveFocus()
    // Kept on the phone: closing the app does not lose it
    expect(loadActiveSession()?.stopwatch?.target).toBe(45)

    // Pause: said under the time, kept on the phone; Resume goes on
    await user.click(within(panel).getByRole('button', { name: 'Pause the stopwatch' }))
    expect(within(panel).getByText('Paused')).toBeInTheDocument()
    expect(loadActiveSession()?.stopwatch?.paused_at).toEqual(expect.any(String))
    await user.click(within(panel).getByRole('button', { name: 'Resume the stopwatch' }))
    expect(within(panel).queryByText('Paused')).not.toBeInTheDocument()
    expect(loadActiveSession()?.stopwatch?.paused_at).toBeNull()

    // Stop at once: one second, at least; the set is ticked, the rest starts
    await user.click(within(panel).getByRole('button', { name: 'Stop' }))
    expect(screen.queryByRole('region', { name: 'Stopwatch' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 1' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Rest' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start the stopwatch: Set 1' })).not.toBeInTheDocument()
  })

  it('shows a time past a minute as minutes and seconds, in the row and in the stepper', async () => {
    // A free workout with a plank, its set empty
    const session = startFreeSession(new Date())
    session.exercises = [exerciseFrom(testExercise({ id: 91, name: 'Plank', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })]
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // 870 typed in the stepper, in seconds: its title says so, and the
    // minutes follow
    await user.click(await screen.findByRole('button', { name: 'Set 1, Seconds: empty' }))
    const stepper = await screen.findByRole('dialog', { name: 'Set 1' })
    await user.type(within(stepper).getByLabelText('Set 1, Seconds'), '870')
    expect(within(stepper).getByText('Seconds · 14:30')).toBeInTheDocument()
    await user.click(within(stepper).getByRole('button', { name: 'Done' }))

    // The row: 14:30, not 870; still 870 seconds in the workout
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 870' })).toHaveTextContent('14:30')
    expect(loadActiveSession()?.exercises[0]?.sets[0]?.seconds).toBe('870')
  })

  it('removes a set or an exercise added by hand, never the plan\'s', async () => {
    const session = startDayA()
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/exercises': exercisePage([testExercise({ id: 40, name: 'Barbell Squat', photos: [] })]),
      'GET /api/sessions/last-sets': { status: 200, body: { data: [] } },
    })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // A set of the plan: its stepper has no Remove
    await user.click(await screen.findByRole('button', { name: 'Set 1, kg: 80' }))
    const planned = await screen.findByRole('dialog', { name: 'Set 1' })
    expect(within(planned).queryByRole('button', { name: 'Remove this set' })).not.toBeInTheDocument()
    await user.click(within(planned).getByRole('button', { name: 'Done' }))

    // A set added: its stepper has Remove, which closes the panel and
    // takes the set away, on screen and on the phone
    await user.click(screen.getByRole('button', { name: 'Add set' }))
    await user.click(screen.getByRole('button', { name: /^Set 5, kg/ }))
    const added = await screen.findByRole('dialog', { name: 'Set 5' })
    await user.click(within(added).getByRole('button', { name: 'Remove this set' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Set 5, kg/ })).not.toBeInTheDocument()
    expect(loadActiveSession()?.exercises[0]?.sets).toHaveLength(6)

    // An exercise of the plan: no Remove in its menu
    await user.click(screen.getByRole('button', { name: 'Options for Barbell Bench Press' }))
    expect(within(await screen.findByRole('dialog', { name: 'Barbell Bench Press' })).queryByRole('button', { name: 'Remove from workout' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    // An exercise added: Remove asks first, then takes it away; the
    // screen goes back to the exercise before it
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: 'Add exercises' }))
    const picker = await screen.findByRole('dialog', { name: 'Add exercises' })
    await user.click(await within(picker).findByRole('checkbox', { name: 'Choose Barbell Squat' }))
    await user.click(within(picker).getByRole('button', { name: 'Add (1)' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Barbell Squat' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Options for Barbell Squat' }))
    const menu = await screen.findByRole('dialog', { name: 'Barbell Squat' })
    await user.click(within(menu).getByRole('button', { name: 'Remove from workout' }))
    expect(within(menu).getByText('Remove Barbell Squat?')).toBeInTheDocument()
    await user.click(within(menu).getByRole('button', { name: 'Remove' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Pullups' })).toBeInTheDocument()
    expect(loadActiveSession()?.exercises.map(item => item.exercise.name)).toEqual(['Barbell Bench Press', 'Bent Over Barbell Row', 'Pullups'])
  })

  it('names the exercise up next, under the sets and in the rest once the exercise is done', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // Under the bench press's sets, a reminder: the rows, with what the
    // plan asks. Found by its role, "complementary" (an <aside>), and name
    const card = await screen.findByRole('complementary', { name: 'Up next' })
    expect(card).toHaveTextContent('Bent Over Barbell Row')
    expect(card).toHaveTextContent('2 × 10/8 · 60–70 kg')
    // A reminder only: nothing in it to tap, moving on is the bottom bar's
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()

    // A set ticked, others left: the rest says nothing of what comes next
    const ticks = screen.getAllByRole('button', { name: /^Tick:/ })
    await user.click(ticks[0]!)
    expect(within(screen.getByRole('region', { name: 'Rest' })).queryByText(/^Up next/)).not.toBeInTheDocument()
    // Every set ticked: the rest leads to the rows, and says so
    for (const tick of ticks.slice(1)) await user.click(tick)
    expect(within(screen.getByRole('region', { name: 'Rest' })).getByText('Up next: Bent Over Barbell Row')).toBeInTheDocument()
    // The screen stays on the bench press, its sets in sight
    expect(screen.getByRole('heading', { level: 2, name: 'Barbell Bench Press' })).toBeInTheDocument()
  })

  it('shows how the exercise is done, from its photo or its name, the workout kept behind', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // The photo: the panel, with the photos, the muscles and the steps,
    // from the copy kept in the workout (no request to the server)
    await user.click(await screen.findByRole('button', { name: 'How to do it: Barbell Bench Press' }))
    const panel = await screen.findByRole('dialog', { name: 'Barbell Bench Press' })
    expect(within(panel).getByText('Equipment: Barbell')).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { name: 'How to do it' })).toBeInTheDocument()
    expect(within(panel).getAllByRole('img')).toHaveLength(2)
    expect(within(panel).getByText('Chest')).toBeInTheDocument()
    expect(within(panel).getByText('Triceps')).toBeInTheDocument()
    expect(within(panel).getByText('Lower the bar to the chest.')).toBeInTheDocument()

    // Closed: the workout as it was. The name opens the same panel
    await user.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(within(screen.getByRole('heading', { level: 2, name: 'Barbell Bench Press' })).getByRole('button'))
    expect(await screen.findByRole('dialog', { name: 'Barbell Bench Press' })).toBeInTheDocument()
  })

  it('races an exercise done as fast as possible against last time', async () => {
    // A plan's day with push-ups, 50 for time; last time 50 in 1:12
    const plan = testPlan()
    const bench = plan.days[0]!.items[0]!
    const day = { id: 'day-c', name: 'Day C', items: [{ ...bench, id: 'item-race', exercise_id: 50, exercise: testExercise({ id: 50, name: 'Pushups', logging_type: 'reps' as const, photos: [] }), for_time: true, sets: [{ ...bench.sets[2]!, target_reps_min: 50, target_reps_max: 50, target_weight_kg: null }] }] }
    const last = [{ exercise_id: 50, session_id: 'old', started_at: '2026-11-02T18:00:00Z', sets: [{ id: 'old-1', set_type: 'normal' as const, weight_kg: null, reps: 50, duration_seconds: 72, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' }] }]
    const session = startSession(plan, day, { unit: 'kg', defaultRestSeconds: 90, lastSets: last, language: 'en', now: new Date() })
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // The row: the reps and the seconds, last time's time in them; no Last column
    expect(await screen.findByRole('button', { name: 'Set 1, Reps: 50' })).toBeInTheDocument()
    // 72 seconds, shown as the stopwatch writes it
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 72' })).toHaveTextContent('1:12')
    expect(screen.queryByText('Last')).not.toBeInTheDocument()

    // The stopwatch: the reps to do, the time to beat. The line holds the
    // set's name in a span of its own, then " · 50 reps · Pushups":
    // getByText reads an element's own text, without its children's, so a
    // regular expression (/…/) finds the line by that part
    await user.click(screen.getByRole('button', { name: 'Start the stopwatch: Set 1' }))
    const panel = screen.getByRole('region', { name: 'Stopwatch' })
    expect(within(panel).getByText(/· 50 reps · Pushups/)).toBeInTheDocument()
    expect(within(panel).getByText('To beat 1:12')).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Stop' }))

    // Ticked with its time, the reps kept
    expect(screen.getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set 1, Reps: 50' })).toBeInTheDocument()
  })

  it('says so for a workout that is not on this phone', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, '/session/0192f4a7-0000-7000-8000-000000000000')

    expect(await screen.findByRole('alert')).toHaveTextContent('This workout is not on this device.')
  })
})
