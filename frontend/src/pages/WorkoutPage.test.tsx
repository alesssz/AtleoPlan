import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
    // The superset of rows and pull-ups is one screen: two in all
    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    // A title above each column: Set, Last, kg, Reps
    for (const title of ['Set', 'Last', 'kg', 'Reps']) expect(screen.getByText(title)).toBeInTheDocument()
    // Add set closes the table; Add exercises is the ＋ after the dots,
    // in the navigation between exercises
    expect(screen.getByRole('button', { name: 'Add set' })).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Exercise 1 of 2' })).getByRole('button', { name: 'Add exercises' })).toBeInTheDocument()
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

  it('goes to the next screen, and to any one through its dot; a superset is one screen, read round by round', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    /** The exercises of an open round, in order. */
    const round = (number: number) => screen.getByRole('region', { name: `Round ${number}` })
    const members = (number: number) => within(round(number)).getAllByRole('group').map(group => group.getAttribute('aria-label'))
    /** An exercise's set in an open round, and its row. */
    const inRound = (number: number, name: string) => within(round(number)).getByRole('group', { name })
    const rowOf = (number: number, name: string) => within(inRound(number, name)).getByRole('listitem')

    // Next: the rows and the pull-ups together, under the superset's name:
    // their headers (two: shown whole), then the rounds
    await userEvent.click(await screen.findByRole('button', { name: 'Next' }))
    const superset = screen.getByRole('region', { name: 'Superset: Bent Over Barbell Row + Pullups' })
    expect(within(superset).getByText('Superset · 2 rounds')).toBeInTheDocument()
    expect(within(superset).getByRole('heading', { level: 2, name: 'Bent Over Barbell Row' })).toBeInTheDocument()
    expect(within(superset).getByRole('heading', { level: 2, name: 'Pullups' })).toBeInTheDocument()
    expect(within(superset).queryByRole('button', { name: /exercises/ })).not.toBeInTheDocument()
    expect(screen.getByText('Exercise 2 of 2')).toBeInTheDocument()
    // Round 1 open: rows, then pull-ups, then the rest. Round 2, only rows
    // (the pull-ups have one set), is a line, closed
    expect(members(1)).toEqual(['Bent Over Barbell Row', 'Pullups'])
    expect(within(round(1)).getByText('Then rest 90 sec')).toBeInTheDocument()
    // Its whole title bar closes even the round in progress, into a line of
    // its own, which opens it again
    await userEvent.click(within(round(1)).getByRole('button', { name: 'Round 1' }))
    expect(screen.queryByRole('region', { name: 'Round 1' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Round 1, in progress: 60×10 · –' }))
    expect(round(1)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Round 2, to do: 70×8' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Round 2' })).not.toBeInTheDocument()
    // No column titles: each value says its unit; an empty added weight, "+kg"
    expect(within(inRound(1, 'Bent Over Barbell Row')).getByRole('button', { name: 'Set 1, Reps: 10' })).toHaveTextContent(/^10\s*reps$/)
    expect(within(inRound(1, 'Pullups')).getByRole('button', { name: 'Set 1, added weight, kg: empty' })).toHaveTextContent('+kg')
    // The last screen: Finish workout at the bottom, though sets are left
    expect(screen.getByRole('button', { name: 'Finish workout' })).toBeInTheDocument()

    // The dots: one per screen, the superset named whole
    await userEvent.click(screen.getByRole('button', { name: 'Exercise 1: Barbell Bench Press' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Barbell Bench Press' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Exercise 2: Bent Over Barbell Row + Pullups' }))

    // Round 1 begins with the rows, marked; once ticked, with no rest, the
    // pull-ups' set is marked
    expect(rowOf(1, 'Bent Over Barbell Row')).toHaveAttribute('aria-current', 'step')
    await userEvent.click(within(inRound(1, 'Bent Over Barbell Row')).getByRole('button', { name: 'Tick: Set 1' }))
    expect(screen.queryByRole('region', { name: 'Rest' })).not.toBeInTheDocument()
    expect(rowOf(1, 'Pullups')).toHaveAttribute('aria-current', 'step')
    expect(rowOf(1, 'Bent Over Barbell Row')).not.toHaveAttribute('aria-current')

    // The pull-ups' reps typed in the stepper's box, then Done, then ✓: the
    // round is over, its rest starts; round 1 closes into a line, round 2
    // opens with its rows marked
    await userEvent.click(within(inRound(1, 'Pullups')).getByRole('button', { name: 'Set 1, Reps: empty' }))
    await userEvent.type(within(await screen.findByRole('dialog', { name: 'Set 1' })).getByLabelText('Set 1, Reps'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    await userEvent.click(within(inRound(1, 'Pullups')).getByRole('button', { name: 'Tick: Set 1' }))
    expect(screen.getByRole('region', { name: 'Rest' })).toBeInTheDocument()
    const roundOne = screen.getByRole('button', { name: 'Round 1, done: 60×10 · 10' })
    expect(rowOf(2, 'Bent Over Barbell Row')).toHaveAttribute('aria-current', 'step')

    // A closed round opens with a tap, to correct it, and closes again
    await userEvent.click(roundOne)
    expect(within(inRound(1, 'Bent Over Barbell Row')).getByRole('button', { name: 'Untick: Set 1' })).toBeInTheDocument()
    await userEvent.click(within(round(1)).getByRole('button', { name: 'Round 1' }))
    expect(screen.queryByRole('region', { name: 'Round 1' })).not.toBeInTheDocument()

    // Add round: a set more of each exercise, so round 2 has both, and a
    // round 3 of rows waits, closed
    await userEvent.click(within(screen.getByRole('region', { name: 'Superset: Bent Over Barbell Row + Pullups' })).getByRole('button', { name: 'Add round' }))
    expect(members(2)).toEqual(['Bent Over Barbell Row', 'Pullups'])
    expect(screen.getByRole('button', { name: 'Round 3, to do: 70×8' })).toBeInTheDocument()
  })

  it('folds what is not needed now: three exercises into one line, closed rounds in a row into one', async () => {
    // Three exercises in a superset, four rounds, the first three done
    const session = startFreeSession(new Date())
    const options = { unit: 'kg' as const, language: 'en', defaultRestSeconds: 60 }
    const member = (id: number, name: string, loggingType: 'reps' | 'time') => {
      const base = exerciseFrom(testExercise({ id, name, logging_type: loggingType }), [], options)
      const sets = Array.from({ length: 4 }, (_, round) => ({ ...base.sets[0]!, id: `${id}-${round}`, reps: '5', seconds: '30', done: round < 3 }))
      return { ...base, superset_group: 1, sets }
    }
    session.exercises = [member(31, 'Pullups', 'reps'), member(32, 'Dips', 'reps'), member(91, 'Plank', 'time')]
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // The headers: one line on a phone, which opens and closes
    const headers = await screen.findByRole('button', { name: /^3 exercises/ })
    expect(headers).toHaveTextContent('Pullups · Dips · Plank')
    expect(headers).toHaveAttribute('aria-expanded', 'false')
    await user.click(headers)
    expect(headers).toHaveAttribute('aria-expanded', 'true')

    // Rounds 1 to 3, done: one line; round 4 open
    const done = screen.getByRole('button', { name: 'Rounds 1–3, done: 5 · 5 · 30 sec' })
    expect(screen.getByRole('region', { name: 'Round 4' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Round 1' })).not.toBeInTheDocument()
    // A tap opens one block with the three rounds' rows, each named by its
    // round; its title closes it again
    await user.click(done)
    const block = screen.getByRole('region', { name: 'Rounds 1–3' })
    expect(within(block).getAllByRole('group').map(group => group.getAttribute('aria-label'))).toEqual([
      'Round 1: Pullups', 'Round 1: Dips', 'Round 1: Plank',
      'Round 2: Pullups', 'Round 2: Dips', 'Round 2: Plank',
      'Round 3: Pullups', 'Round 3: Dips', 'Round 3: Plank',
    ])
    expect(screen.queryByRole('region', { name: 'Round 1' })).not.toBeInTheDocument()
    await user.click(within(block).getByRole('button', { name: 'Rounds 1–3' }))
    expect(screen.queryByRole('region', { name: 'Rounds 1–3' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rounds 1–3, done: 5 · 5 · 30 sec' })).toBeInTheDocument()
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

  it('pauses on screen: the rest stands still, a reload stays paused, Resume and a tick go on', async () => {
    const session = startDayA()
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Tick: Set 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pause workout' }))

    // Said in a bar of its own, with Resume; the rest kept where it was
    const bar = screen.getByRole('region', { name: 'Workout paused' })
    expect(within(bar).getByRole('status')).toHaveTextContent('Workout paused')
    expect(within(screen.getByRole('region', { name: 'Rest' })).getByRole('timer')).toHaveTextContent(/1:(29|30)/)
    expect(loadActiveSession()).toMatchObject({ paused_at: expect.any(String), running_since: null })

    // Opened again, as after a reload: still paused
    cleanup()
    renderRoutes(routes, `/session/${session.id}`)
    expect(await screen.findByRole('region', { name: 'Workout paused' })).toBeInTheDocument()
    expect(loadActiveSession()?.running_since).toBeNull()

    // Resume, from the bar: the clock runs again
    await userEvent.click(within(screen.getByRole('region', { name: 'Workout paused' })).getByRole('button', { name: 'Resume' }))
    expect(screen.queryByRole('region', { name: 'Workout paused' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause workout' })).toBeInTheDocument()
    expect(loadActiveSession()).toMatchObject({ paused_at: null, running_since: expect.any(String) })

    // Paused again, then a tick: ticking is training, so the pause ends
    await userEvent.click(screen.getByRole('button', { name: 'Pause workout' }))
    await userEvent.click(screen.getByRole('button', { name: 'Tick: Set 2' }))
    expect(screen.queryByRole('region', { name: 'Workout paused' })).not.toBeInTheDocument()
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

    // Docked under the sets, not over them: the exercise and last time; the
    // table still there for screen readers too (a dialog would hide it), the
    // set timed marked, every ▶ off
    const panel = screen.getByRole('region', { name: 'Stopwatch' })
    expect(within(panel).getByText(/Dead Hang/)).toBeInTheDocument()
    expect(within(panel).getByText('Last time 0:45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tick: Set 1' }).closest('li')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Start the stopwatch: Set 1' })).toBeDisabled()
    // First 5 seconds to get ready, with no Pause, which would count nothing;
    // Start now has the focus, as the ▶ tapped is disabled
    expect(within(panel).getByRole('timer')).toHaveTextContent('5')
    expect(within(panel).queryByRole('button', { name: 'Pause the stopwatch' })).not.toBeInTheDocument()
    const main = within(panel).getByRole('button', { name: 'Start now' })
    expect(main).toHaveFocus()
    // Kept on the phone: closing the app does not lose it
    expect(loadActiveSession()?.stopwatch?.target).toBe(45)

    // Start now: the hold counts down its 45 seconds; the same button, with
    // the focus, is now Stop
    await user.click(main)
    await waitFor(() => expect(within(panel).getByRole('timer')).toHaveTextContent('0:45'))
    expect(within(panel).getByText('Target 0:45')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Stop' })).toHaveFocus()

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

  it('regroups rounds unticked one by one as rounds to do', async () => {
    // Pull-ups and dips, three rounds, all done
    const session = startFreeSession(new Date())
    const options = { unit: 'kg' as const, language: 'en', defaultRestSeconds: 60 }
    const member = (id: number, name: string) => {
      const base = exerciseFrom(testExercise({ id, name, logging_type: 'reps' }), [], options)
      return { ...base, superset_group: 1, sets: Array.from({ length: 3 }, (_, round) => ({ ...base.sets[0]!, id: `${id}-${round}`, reps: '5', done: true })) }
    }
    session.exercises = [member(31, 'Pullups'), member(32, 'Dips')]
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()
    const untick = (block: string, group: string, set: number) => user.click(within(within(screen.getByRole('region', { name: block })).getByRole('group', { name: group })).getByRole('button', { name: `Untick: Set ${set}` }))

    // Everything done: one line, opened to correct
    await user.click(await screen.findByRole('button', { name: 'Rounds 1–3, done: 5 · 5' }))

    // Round 3's dips unticked: round 3 is in progress, open on its own;
    // rounds 1 and 2 stay open together
    await untick('Rounds 1–3', 'Round 3: Dips', 3)
    expect(screen.getByRole('region', { name: 'Round 3' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Rounds 1–2' })).toBeInTheDocument()

    // Round 2's dips unticked: round 2 is in progress; round 3, to do, leaves
    // for a line; round 1, left alone, is open as its round
    await untick('Rounds 1–2', 'Round 2: Dips', 2)
    expect(screen.getByRole('region', { name: 'Round 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Round 3, to do: 5 · 5' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Round 1' })).toBeInTheDocument()

    // Round 1's dips unticked: rounds 2 and 3, to do, merge into one line
    await untick('Round 1', 'Dips', 1)
    expect(screen.getByRole('region', { name: 'Round 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rounds 2–3, to do: 5 · 5' })).toBeInTheDocument()
  })

  it('times a hold inside a superset, on the screen of the superset', async () => {
    // A plank, then pull-ups, as a superset of a free workout
    const session = startFreeSession(new Date())
    const options = { unit: 'kg' as const, language: 'en', defaultRestSeconds: 60 }
    session.exercises = [
      { ...exerciseFrom(testExercise({ id: 91, name: 'Plank', logging_type: 'time' }), [], options), superset_group: 1 },
      { ...exerciseFrom(testExercise({ id: 31, name: 'Pullups', logging_type: 'reps' }), [], options), superset_group: 1 },
    ]
    session.exercises[0]!.sets[0]!.seconds = '30'
    session.exercises[1]!.sets[0]!.reps = '10'
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)
    const user = userEvent.setup()

    // Round 1: the plank, then the pull-ups; ▶ on the plank, started at once
    const round = await screen.findByRole('region', { name: 'Round 1' })
    const plank = within(round).getByRole('group', { name: 'Plank' })
    await user.click(within(plank).getByRole('button', { name: 'Start the stopwatch: Set 1' }))
    const panel = screen.getByRole('region', { name: 'Stopwatch' })
    await user.click(within(panel).getByRole('button', { name: 'Start now' }))
    await user.click(within(panel).getByRole('button', { name: 'Stop' }))

    // The plank ticked with its time; the round goes on, without a rest, to
    // the pull-ups' set, marked, on the same screen
    expect(within(plank).getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('region', { name: 'Rest' })).not.toBeInTheDocument()
    expect(within(within(round).getByRole('group', { name: 'Pullups' })).getByRole('listitem')).toHaveAttribute('aria-current', 'step')
  })

  it('stops a hold by itself at its target, and starts the rest', async () => {
    // A plank aiming at 30 seconds, counting for 29.5 already
    const session = startFreeSession(new Date())
    session.exercises = [exerciseFrom(testExercise({ id: 91, name: 'Plank', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })]
    const set = session.exercises[0]!.sets[0]!
    set.seconds = '30'
    session.stopwatch = { set_id: set.id, started_at: new Date(Date.now() - 29_500).toISOString(), target: 30 }
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    expect(await screen.findByRole('region', { name: 'Stopwatch' })).toBeInTheDocument()
    // Half a second later, nothing tapped
    expect(await screen.findByRole('region', { name: 'Rest' }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Stopwatch' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 30' })).toBeInTheDocument()
  })

  it('writes the target even when the timer at the target fires a moment early', async () => {
    // Every timer 50 ms early, as one may be by a millisecond
    const realSetTimeout = globalThis.setTimeout
    const early = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, ms?: number) =>
      realSetTimeout(callback, Math.max(0, (ms ?? 0) - 50))) as typeof setTimeout)
    try {
      const session = startFreeSession(new Date())
      session.exercises = [exerciseFrom(testExercise({ id: 91, name: 'Plank', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })]
      const set = session.exercises[0]!.sets[0]!
      set.seconds = '30'
      session.stopwatch = { set_id: set.id, started_at: new Date(Date.now() - 29_500).toISOString(), target: 30 }
      storeActiveSession(session)
      fakeApi({ 'GET /api/user': signedInAs() })
      renderRoutes(routes, `/session/${session.id}`)

      expect(await screen.findByRole('region', { name: 'Rest' }, { timeout: 3000 })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Set 1, Seconds: 30' })).toBeInTheDocument()
    }
    finally {
      early.mockRestore()
    }
  })

  it('stops a hold whose target passed while the app was closed, with the target as its time', async () => {
    // Started a minute ago, aiming at 30 seconds
    const session = startFreeSession(new Date())
    session.exercises = [exerciseFrom(testExercise({ id: 91, name: 'Plank', logging_type: 'time' }), [], { unit: 'kg', language: 'en', defaultRestSeconds: 90 })]
    const set = session.exercises[0]!.sets[0]!
    set.seconds = '30'
    session.stopwatch = { set_id: set.id, started_at: new Date(Date.now() - 60_000).toISOString(), target: 30 }
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${session.id}`)

    expect(await screen.findByRole('button', { name: 'Untick: Set 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Set 1, Seconds: 30' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Stopwatch' })).not.toBeInTheDocument()
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
    // plan asks
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
    // set's name in a span of its own, then " · 50 reps · Pushups", found
    // by that part
    await user.click(screen.getByRole('button', { name: 'Start the stopwatch: Set 1' }))
    const panel = screen.getByRole('region', { name: 'Stopwatch' })
    expect(within(panel).getByText(/· 50 reps · Pushups/)).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Start now' }))
    // Counting up from 0, unlike a hold
    await waitFor(() => expect(within(panel).getByRole('timer')).toHaveTextContent('0:00'))
    expect(within(panel).getByText('To beat 1:12')).toBeInTheDocument()
    // ✓ at the end of the reps, as Stop would: the stopwatch goes
    await user.click(screen.getByRole('button', { name: 'Tick: Set 1' }))
    expect(screen.queryByRole('region', { name: 'Stopwatch' })).not.toBeInTheDocument()

    // Ticked with the time measured, not last time's 1:12; the reps kept
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
