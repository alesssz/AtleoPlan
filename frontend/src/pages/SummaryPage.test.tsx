/*
 * The summary after Finish, used as a person would: the numbers and each
 * exercise against last time, worked out on the phone with no request, Save
 * with the feeling and the notes, Save with nothing to add, Delete (sent or
 * still waiting), and an address whose workout is not on this phone.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { LastSets, SessionInput } from '@/api/sessions'
import { addPending, loadFinished, loadPending, storeFinished, type WorkoutOutcome } from '@/components/workout/session-storage'
import { startSession, toSessionInput, workoutReducer } from '@/components/workout/workout-session'
import { fakeApi, renderRoutes, sentBody, signedInAs } from '@/test/auth-helpers'
import { testPlan } from '@/test/plan-helpers'
import { SummaryPage } from './SummaryPage'

/** The page, and stand-ins for where it goes. */
const routes = [
  { path: 'session/:id/summary', element: <SummaryPage /> },
  { path: '/', element: <p>home</p> },
  { path: 'progress/history/:id', element: <p>the workout in history</p> },
]

/** Last time's bench press, as workout mode read it at the start: a warm-up, then 80 × 6. */
const lastBench: LastSets = {
  exercise_id: 12,
  session_id: 'session-old',
  started_at: '2026-11-09T18:00:00Z',
  sets: [
    { id: 'old-1', set_type: 'warm_up', weight_kg: '40.000', reps: 10, duration_seconds: null, distance_meters: null, completed_at: '2026-11-09T18:05:00Z' },
    { id: 'old-2', set_type: 'normal', weight_kg: '80.000', reps: 6, duration_seconds: null, distance_meters: null, completed_at: '2026-11-09T18:08:00Z' },
  ],
}

/**
 * Day A finished with the warm-up (40 × 10) and the first set that counts
 * (80 × 8, the plan's target) of the bench press ticked, kept on the phone
 * as Finish keeps it.
 * @param outcome what happened when it was sent at Finish
 */
function finishDayA(outcome: WorkoutOutcome): { id: string, input: SessionInput } {
  const plan = testPlan()
  const now = new Date('2026-11-16T18:00:00Z')
  const started = startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [lastBench], language: 'en', now })
  // [action, …].reduce(workoutReducer, start): the actions one after another
  const finished = [
    { type: 'toggleSet', exercise: 0, set: 0, now: '2026-11-16T18:05:00Z' },
    { type: 'toggleSet', exercise: 0, set: 2, now: '2026-11-16T18:08:00Z' },
    { type: 'finish', now: '2026-11-16T18:40:00Z' },
  ].reduce((session, action) => workoutReducer(session, action as Parameters<typeof workoutReducer>[1]), started)
  const input = toSessionInput(finished, 'kg', new Date('2026-11-16T18:40:00Z'))
  storeFinished({ id: finished.id, session: finished, input, outcome })
  return { id: finished.id, input }
}

describe('SummaryPage', () => {
  it('shows the numbers and each exercise against last time, with no request', async () => {
    const { id } = finishDayA('queued')
    const fake = fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, `/session/${id}/summary`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Day A – Push' })).toBeInTheDocument()
    // 40 minutes; one exercise; one set and 8 reps (the warm-up left out).
    // Each label (dt) comes before its number (dd) in the page
    expect(screen.getByText('Time').nextSibling).toHaveTextContent('40 min')
    // selector: the tile's label, not the list's heading of the same word
    expect(screen.getByText('Exercises', { selector: 'dt' }).nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Sets').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Reps').nextSibling).toHaveTextContent('8')
    // 80 × 8 against last time's 80 × 6: better, offline too
    expect(screen.getByText('Against last time:').parentElement).toHaveTextContent('Against last time: 1 better')
    // The exercises, folded and closed at first: not in the page until a
    // tap opens them. The button's name is its text: "Exercises 3", the
    // two not done included
    const toggle = screen.getByRole('button', { name: 'Exercises 3' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('80×8 · last time 80×6')).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('80×8 · last time 80×6')).toBeInTheDocument()
    // Nothing asked of the server but the user
    expect(fake.mock.calls.map(([path]) => path)).toEqual(['/api/user'])
  })

  it('saves the feeling and the notes with the workout, then opens Home', async () => {
    const { id } = finishDayA('saved')
    const fake = fakeApi({ 'GET /api/user': signedInAs(), [`PUT /api/sessions/${id}`]: { status: 200, body: { data: { id } } } })
    const { router } = renderRoutes(routes, `/session/${id}/summary`)
    const user = userEvent.setup()

    const feelings = await screen.findByRole('radiogroup', { name: 'How did it feel?' })
    await user.click(within(feelings).getByRole('radio', { name: '4, Good' }))
    expect(within(feelings).getByRole('radio', { name: '4, Good' })).toHaveAttribute('aria-checked', 'true')
    await user.type(screen.getByLabelText('Notes'), '  Shoulder a bit tight  ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ workout: 'saved' })
    // The whole workout sent again, with the answers; the notes trimmed
    expect(sentBody(fake, `/api/sessions/${id}`)).toMatchObject({ feeling: 4, notes: 'Shoulder a bit tight' })
    expect(loadFinished()).toBeNull()
    expect(loadPending()).toEqual({})
  })

  it('sends nothing when there is nothing to add', async () => {
    const { id } = finishDayA('queued')
    const fake = fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, `/session/${id}/summary`)

    // Waiting for the network: said at the top
    expect(await screen.findByText(/it will be sent as soon as you are online/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ workout: 'queued' })
    expect(fake.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  it('deletes a workout already on the server', async () => {
    const { id } = finishDayA('saved')
    const fake = fakeApi({ 'GET /api/user': signedInAs(), [`DELETE /api/sessions/${id}`]: { status: 204 } })
    const { router } = renderRoutes(routes, `/session/${id}/summary`)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete workout' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this workout?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete workout' }))

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ workout: 'deleted' })
    expect(fake.mock.calls.map(([path, init]) => `${init?.method} ${path}`)).toContain(`DELETE /api/sessions/${id}`)
    expect(loadFinished()).toBeNull()
  })

  it('deletes a workout still waiting for the network: it leaves the queue, and never reaches the server', async () => {
    const { id, input } = finishDayA('queued')
    addPending(id, input)
    fakeApi({ 'GET /api/user': signedInAs(), [`DELETE /api/sessions/${id}`]: 'network' })
    renderRoutes(routes, `/session/${id}/summary`)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete workout' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete workout' }))

    expect(await screen.findByText('home')).toBeInTheDocument()
    expect(loadPending()).toEqual({})
  })

  it('opens the workout in history when it is not on this phone', async () => {
    fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, '/session/0192f4a7-0000-7000-8000-000000000000/summary')

    expect(await screen.findByText('the workout in history')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/progress/history/0192f4a7-0000-7000-8000-000000000000')
  })
})
