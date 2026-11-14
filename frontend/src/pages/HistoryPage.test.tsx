/*
 * History and a workout's page in it, and Progress with the latest workouts:
 * the list by month with Show more, a workout's sets and its comparison,
 * Delete, a workout that is not there, and the empty states.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/api/sessions'
import { fakeApi, renderRoutes, signedInAs } from '@/test/auth-helpers'
import { testSessionDetail, testWorkoutSession } from '@/test/session-helpers'
import { HistoryDetailPage } from './HistoryDetailPage'
import { HistoryPage } from './HistoryPage'
import { ProgressPage } from './ProgressPage'

/** The three pages, and a stand-in for Home. */
const routes = [
  { path: 'progress', element: <ProgressPage /> },
  { path: 'progress/history', element: <HistoryPage /> },
  { path: 'progress/history/:id', element: <HistoryDetailPage /> },
  { path: '/', element: <p>home</p> },
]

/**
 * One page of GET /api/sessions.
 * @param lastPage the number of the last page
 */
function sessionPage(sessions: WorkoutSession[], page = 1, lastPage = 1) {
  return { status: 200, body: { data: sessions, meta: { current_page: page, last_page: lastPage, total: sessions.length } } }
}

/** Three workouts: two in November, one in October, newest first. */
const three = [
  testWorkoutSession({ id: 's-3', day_name: 'Day B – Legs', started_at: '2026-11-11T18:00:00Z' }),
  testWorkoutSession({ id: 's-2', started_at: '2026-11-09T18:00:00Z' }),
  testWorkoutSession({ id: 's-1', plan_id: null, plan_day_id: null, plan_name: null, day_name: null, started_at: '2026-10-30T18:00:00Z' }),
]

describe('HistoryPage', () => {
  it('lists the workouts by month, each a link to its page, with Show more', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/sessions?status=finished&page=1&per_page=20': sessionPage(three, 1, 2),
      'GET /api/sessions?status=finished&page=2&per_page=20': sessionPage([testWorkoutSession({ id: 's-0', day_name: 'Day C – Pull', started_at: '2026-10-20T18:00:00Z' })], 2, 2),
    })
    renderRoutes(routes, '/progress/history')

    const november = await screen.findByRole('region', { name: 'November 2026' })
    expect(within(november).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(['/progress/history/s-3', '/progress/history/s-2'])
    // "45 min · 7 sets · 56 reps"
    expect(within(november).getAllByText('45 min · 7 sets · 56 reps')).toHaveLength(2)
    // A free workout says so
    const october = screen.getByRole('region', { name: 'October 2026' })
    expect(within(october).getByText('Free workout')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }))
    expect(await within(october).findByText('Day C – Pull')).toBeInTheDocument()
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/sessions?status=finished&page=2&per_page=20')
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
  })

  it('says so when there is no workout yet', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([]) })
    renderRoutes(routes, '/progress/history')

    expect(await screen.findByRole('heading', { name: 'No workouts yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/')
  })
})

describe('HistoryDetailPage', () => {
  it('shows a workout: its numbers, each exercise against last time, how it felt, the sets', async () => {
    // Last time, the bench press once at 80 × 8: the same best set, fewer reps
    const lastBench = { exercise_id: 12, session_id: 'before', started_at: '2026-11-02T18:00:00Z', sets: [{ id: 'old', set_type: 'normal', weight_kg: '80.000', reps: 8, duration_seconds: null, distance_meters: null, completed_at: '2026-11-02T18:05:00Z' }] }
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/sessions/session-1': { status: 200, body: { data: testSessionDetail({ feeling: 4, notes: 'Good pump.' }), meta: { last_sets: [lastBench] } } },
    })
    renderRoutes(routes, '/progress/history/session-1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Day A – Push' })).toBeInTheDocument()
    expect(screen.getByText('Reps').nextSibling).toHaveTextContent('56')
    // The bench press: 80 × 8 twice against once, better; the pull-ups
    // skipped, not counted
    expect(screen.getByText('Against last time:').parentElement).toHaveTextContent('Against last time: 1 better')
    expect(screen.getByText('Felt: Good (4/5)')).toBeInTheDocument()
    expect(screen.getByText('Good pump.')).toBeInTheDocument()
    // The bench press: W1 40×10, then 1 and 2 at 80×8; the pull-ups skipped
    const exercises = screen.getByRole('region', { name: 'Exercises' })
    expect(within(exercises).getAllByRole('listitem').map(item => item.textContent)).toEqual(expect.arrayContaining(['W140×10', '180×8', '280×8']))
    expect(within(exercises).getByText('Skipped')).toBeInTheDocument()
    expect(within(exercises).getByText('Better')).toBeInTheDocument()
    expect(within(exercises).getByText('80×8 · last time 80×8')).toBeInTheDocument()
    // The exercise's own volume, 80 × 8 twice, the warm-up left out
    expect(within(exercises).getByText('Volume of this exercise: 1,280 kg')).toBeInTheDocument()
  })

  it('deletes a workout, after a question, and goes back to history', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/sessions/session-1': { status: 200, body: { data: testSessionDetail(), meta: { last_sets: [] } } },
      'DELETE /api/sessions/session-1': { status: 204 },
      'GET /api/sessions': sessionPage([]),
    })
    const { router } = renderRoutes(routes, '/progress/history/session-1')

    await userEvent.click(await screen.findByRole('button', { name: 'Delete workout' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete workout' }))

    expect(await screen.findByRole('heading', { name: 'No workouts yet' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/progress/history')
    expect(fake.mock.calls.map(([path, init]) => `${init?.method ?? 'GET'} ${path}`)).toContain('DELETE /api/sessions/session-1')
  })

  it('says so for a workout that is not there', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions/gone': { status: 404, body: { message: 'Not found.' } } })
    renderRoutes(routes, '/progress/history/gone')

    expect(await screen.findByRole('alert')).toHaveTextContent('This workout is not here')
  })
})

describe('ProgressPage', () => {
  it('shows the three latest workouts and the way to all of them; charts are coming', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([...three, testWorkoutSession({ id: 's-0' })]) })
    renderRoutes(routes, '/progress')

    const latest = await screen.findByRole('region', { name: 'Latest workouts' })
    expect(within(latest).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'All workouts' })).toHaveAttribute('href', '/progress/history')
    expect(within(screen.getByRole('region', { name: 'Charts and records' })).getByText('Coming soon')).toBeInTheDocument()
  })

  it('leads to Home before the first workout', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([]) })
    renderRoutes(routes, '/progress')

    expect(await screen.findByRole('heading', { name: 'Your progress starts with the first workout' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start a workout' })).toHaveAttribute('href', '/')
  })
})
