/*
 * Home, used as a person would: the active plan's card with the suggested day,
 * Start, another day chosen with its chip, the workout in progress (resumed,
 * finished or deleted from its banner), Free workout, this week, and Home
 * without an active plan or without the network.
 */
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { HomeData } from '@/api/home'
import type { WorkoutSession } from '@/api/sessions'
import { loadActiveSession, loadFinished, storeActiveSession } from '@/components/workout/session-storage'
import { startSession } from '@/components/workout/workout-session'
import { fakeApi, renderRoutes, signedInAs } from '@/test/auth-helpers'
import { testPlan, testPlanSummary } from '@/test/plan-helpers'
import { HomePage } from './HomePage'

/** The page, and a stand-in for workout mode. */
const routes = [
  { path: '/', element: <HomePage /> },
  { path: 'session/:id', element: <p>workout mode</p> },
  { path: 'session/:id/summary', element: <p>the summary</p> },
]

/** A workout finished today at the current time, with its totals. */
function today(changes: Partial<WorkoutSession> = {}): WorkoutSession {
  const now = new Date().toISOString()
  return { id: 'w-1', plan_id: 'plan-ppl', day_name: 'Day A – Push', started_at: now, finished_at: now, duration_seconds: 2700, sets_done: 8, ...changes }
}

/**
 * The answer of GET /api/home: the test plan active, Day A done last, Day B
 * suggested; changed as asked.
 */
function homeAnswer(changes: Partial<HomeData> = {}) {
  const data: HomeData = {
    active_plan: testPlanSummary(),
    days: [
      { id: 'day-a', name: 'Day A – Push', exercises: 3, estimated_minutes: 25 },
      { id: 'day-b', name: 'Day B – Legs', exercises: 1, estimated_minutes: 8 },
    ],
    suggested_day_id: 'day-b',
    last_day: { id: 'day-a', name: 'Day A – Push', finished_at: new Date().toISOString() },
    open_session: null,
    recent_sessions: [],
    ...changes,
  }
  return { status: 200, body: { data } }
}

/** The answers Start needs: the whole plan, and no sets from last time. */
const startAnswers = {
  'GET /api/plans/plan-ppl': { status: 200, body: { data: testPlan() } },
  'GET /api/sessions/last-sets': { status: 200, body: { data: [] } },
}

describe('HomePage', () => {
  it('shows the active plan with the suggested day, and starts it', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer(), ...startAnswers })
    const { router } = renderRoutes(routes, '/')

    const card = await screen.findByRole('region', { name: 'Push Pull Legs' })
    expect(within(card).getByText('Suggested')).toBeInTheDocument()
    expect(within(card).getByText('Day B – Legs', { selector: 'p' })).toBeInTheDocument()
    expect(within(card).getByText('1 exercise')).toBeInTheDocument()
    expect(within(card).getByText('about 8 min')).toBeInTheDocument()
    expect(within(card).getByText('Last time you did Day A – Push')).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Start' }))

    // The whole plan was read, then workout mode opened on Day B
    expect(await screen.findByText('workout mode')).toBeInTheDocument()
    const session = loadActiveSession()
    expect(router.state.location.pathname).toBe(`/session/${session?.id}`)
    expect(session?.day_name).toBe('Day B – Legs')
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/sessions/last-sets?exercises=40')
  })

  it('chooses another day with its chip; Start then starts that one', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer(), ...startAnswers })
    renderRoutes(routes, '/')

    const card = await screen.findByRole('region', { name: 'Push Pull Legs' })
    await userEvent.click(within(card).getByRole('button', { name: 'Day A – Push' }))

    // Day A on the card, no longer "Suggested", its chip pressed
    expect(within(card).getByText('Day A – Push', { selector: 'p' })).toBeInTheDocument()
    expect(within(card).queryByText('Suggested')).not.toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Day A – Push' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(within(card).getByRole('button', { name: 'Start' }))
    expect(await screen.findByText('workout mode')).toBeInTheDocument()
    expect(loadActiveSession()?.day_name).toBe('Day A – Push')
  })

  it('says so when the plan cannot be read to start', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer(), 'GET /api/plans/plan-ppl': 'network' })
    renderRoutes(routes, '/')

    await userEvent.click(await screen.findByRole('button', { name: 'Start' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The plan could not be loaded.')
    expect(loadActiveSession()).toBeNull()
  })

  it('offers to resume a workout in progress, and starts no other', async () => {
    const plan = testPlan()
    const session = startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [], language: 'en', now: new Date() })
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer() })
    renderRoutes(routes, '/')

    expect(await screen.findByText('Workout in progress: Day A – Push')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', `/session/${session.id}`)
    expect(await screen.findByRole('button', { name: 'Start' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Start a free workout' })).toBeDisabled()
  })

  it('finishes a workout left open from its banner, after the same question, then opens its summary', async () => {
    const plan = testPlan()
    const session = startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [], language: 'en', now: new Date() })
    storeActiveSession(session)
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer(), [`PUT /api/sessions/${session.id}`]: { status: 201, body: { data: { id: session.id } } } })
    const { router } = renderRoutes(routes, '/')

    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Finish the workout?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Finish and save' }))

    expect(await screen.findByText('the summary')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/session/${session.id}/summary`)
    // Sent, no longer in progress, kept for the summary
    expect(fake.mock.calls.map(([path, init]) => `${init?.method} ${path}`)).toContain(`PUT /api/sessions/${session.id}`)
    expect(loadActiveSession()).toBeNull()
    expect(loadFinished()?.id).toBe(session.id)
  })

  it('deletes a workout left open from its banner: nothing sent, Start free again', async () => {
    const plan = testPlan()
    const session = startSession(plan, plan.days[0]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [], language: 'en', now: new Date() })
    storeActiveSession(session)
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer() })
    renderRoutes(routes, '/')

    // Finish's dialog, then Delete workout, then the second question
    await userEvent.click(await screen.findByRole('button', { name: 'Finish' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete workout' }))
    await userEvent.click(within(screen.getByRole('alertdialog', { name: 'Delete the workout in progress?' })).getByRole('button', { name: 'Delete' }))

    // The banner gone, Start usable again; forgotten on the phone, no request
    await waitFor(() => expect(screen.queryByText('Workout in progress: Day A – Push')).not.toBeInTheDocument())
    expect(await screen.findByRole('button', { name: 'Start' })).toBeEnabled()
    expect(loadActiveSession()).toBeNull()
    expect(fake.mock.calls.some(([path]) => path.startsWith('/api/sessions'))).toBe(false)
  })

  it('starts a free workout, with no plan and no exercises', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer({ active_plan: null, days: [], suggested_day_id: null, last_day: null }) })
    renderRoutes(routes, '/')

    // No active plan: the empty state, and Free workout still there
    expect(await screen.findByRole('heading', { name: 'No active plan yet' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start a free workout' }))

    expect(await screen.findByText('workout mode')).toBeInTheDocument()
    expect(loadActiveSession()).toMatchObject({ plan_id: null, day_name: null, exercises: [] })
  })

  it('marks the days trained this week, with the week\'s numbers', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer({ recent_sessions: [today(), today({ id: 'w-2', sets_done: 4, duration_seconds: 1500 })] }) })
    renderRoutes(routes, '/')

    const week = await screen.findByRole('region', { name: 'This week' })
    // Today: trained, said in words too
    expect(await within(week).findByText('workout done')).toBeInTheDocument()
    // Two workouts, 12 sets, 70 minutes. Each label (dt) comes before its
    // number (dd) in the page, though drawn under it
    expect(within(week).getByText('Workouts').nextSibling).toHaveTextContent('2')
    expect(within(week).getByText('Sets').nextSibling).toHaveTextContent('12')
    expect(within(week).getByText('Minutes').nextSibling).toHaveTextContent('70')
    expect(within(week).queryByText(/No workouts yet this week/)).not.toBeInTheDocument()
  })

  it('says what happened to a workout after its summary', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': homeAnswer() })
    const { router } = renderRoutes(routes, '/')
    await screen.findByRole('region', { name: 'Push Pull Legs' })

    await router.navigate('/', { state: { workout: 'deleted' } })

    expect(await screen.findByText('Workout deleted.')).toBeInTheDocument()
  })

  it('offers to try again when Home cannot be read', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/home': { status: 500, body: { message: 'Server Error' } } })
    renderRoutes(routes, '/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Home could not be loaded.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
