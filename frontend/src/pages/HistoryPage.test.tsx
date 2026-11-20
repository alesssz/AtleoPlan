import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { WorkoutSession } from '@/api/sessions'
import { fakeApi, renderRoutes, signedInAs } from '@/test/auth-helpers'
import { testSessionDetail, testWorkoutSession } from '@/test/session-helpers'
import { HistoryDetailPage } from './HistoryDetailPage'
import { HistoryPage } from './HistoryPage'
import { ProgressPage } from './ProgressPage'

const routes = [
  { path: 'progress', element: <ProgressPage /> },
  { path: 'progress/history', element: <HistoryPage /> },
  { path: 'progress/history/:id', element: <HistoryDetailPage /> },
  { path: '/', element: <p>home</p> },
]

/** One page of GET /api/sessions. */
function sessionPage(sessions: WorkoutSession[], page = 1, lastPage = 1) {
  return { status: 200, body: { data: sessions, meta: { current_page: page, last_page: lastPage, total: sessions.length } } }
}

/**
 * A moment from the device's own clock, as the API would send it: the page
 * shows it back in the device's time zone, so the text is the same in every
 * zone. Months from 1.
 */
function local(month: number, day: number, hours: number, minutes = 0): string {
  return new Date(2026, month - 1, day, hours, minutes).toISOString()
}

/** Three workouts, 18:00 to 18:45: two in November, one in October, newest first. */
const three = [
  testWorkoutSession({ id: 's-3', day_name: 'Day B – Legs', started_at: local(11, 11, 18), finished_at: local(11, 11, 18, 45) }),
  testWorkoutSession({ id: 's-2', started_at: local(11, 9, 18), finished_at: local(11, 9, 18, 45) }),
  testWorkoutSession({ id: 's-1', plan_id: null, plan_day_id: null, plan_name: null, day_name: null, started_at: local(10, 30, 18), finished_at: local(10, 30, 18, 45) }),
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
    // When, then the sets; the rest is on the workout's page
    expect(within(november).getAllByText('6:00 – 6:45 PM · 7 sets')).toHaveLength(2)
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
      'GET /api/sessions/session-1': { status: 200, body: { data: testSessionDetail({ feeling: 4, notes: 'Good pump.', started_at: local(11, 9, 18), finished_at: local(11, 9, 18, 45) }), meta: { last_sets: [lastBench] } } },
    })
    renderRoutes(routes, '/progress/history/session-1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Day A – Push' })).toBeInTheDocument()
    // Above the title, the date and when it started and ended
    expect(screen.getByText('Monday, November 9, 2026 · 6:00 – 6:45 PM')).toBeInTheDocument()
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

  it('shows the date of the end too for a workout left open overnight', async () => {
    // Started at 23:30, finished at 8:10 the next morning, 50 minutes trained
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/sessions/session-1': { status: 200, body: { data: testSessionDetail({ started_at: local(11, 19, 23, 30), finished_at: local(11, 20, 8, 10), duration_seconds: 3000 }), meta: { last_sets: [] } } },
    })
    renderRoutes(routes, '/progress/history/session-1')

    expect(await screen.findByText('Thursday, November 19, 2026 · 11:30 PM – Nov 20, 8:10 AM')).toBeInTheDocument()
    expect(screen.getByText('50 min')).toBeInTheDocument()
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

  it('lists one day\'s workouts from Home\'s calendar, from the device\'s midnight to the next', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([three[1]!]) })
    renderRoutes(routes, '/progress/history?from=2026-11-09&to=2026-11-09')

    expect(await screen.findByRole('link', { name: /Day A – Push/ })).toHaveAttribute('href', '/progress/history/s-2')
    expect(screen.getByLabelText('From')).toHaveValue('2026-11-09')
    expect(screen.getByLabelText('To')).toHaveValue('2026-11-09')
    expect(screen.getByText('1 workout in these days')).toBeInTheDocument()
    const from = encodeURIComponent(new Date(2026, 10, 9).toISOString())
    const to = encodeURIComponent(new Date(2026, 10, 10).toISOString())
    expect(fake.mock.calls.map(([path]) => path)).toContain(`/api/sessions?status=finished&page=1&per_page=20&from=${from}&to=${to}`)
  })

  it('filters between two days chosen with the phone\'s pickers, either end open, and clears them', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage(three) })
    const { router } = renderRoutes(routes, '/progress/history')
    await screen.findByRole('region', { name: 'November 2026' })
    const paths = () => fake.mock.calls.map(([path]) => path)

    // The phone's own picker sets the field's value
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-01' } })
    expect(router.state.location.search).toBe('?from=2026-11-01')
    await waitFor(() => expect(paths().at(-1)).toBe(`/api/sessions?status=finished&page=1&per_page=20&from=${encodeURIComponent(new Date(2026, 10, 1).toISOString())}`))

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-11-15' } })
    expect(router.state.location.search).toBe('?from=2026-11-01&to=2026-11-15')

    // A start moved past the end takes the end with it
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-20' } })
    expect(router.state.location.search).toBe('?from=2026-11-20&to=2026-11-20')

    await userEvent.click(screen.getByRole('button', { name: 'Clear the dates' }))
    expect(router.state.location.search).toBe('')
    expect(screen.getByLabelText('From')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Clear the dates' })).not.toBeInTheDocument()
  })

  it('says how many for days with none, and ignores a date that is not one', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([]) })
    renderRoutes(routes, '/progress/history?from=2026-11-08&to=2026-11-08')

    expect(await screen.findByText('0 workouts in these days')).toBeInTheDocument()

    cleanup()
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage(three) })
    renderRoutes(routes, '/progress/history?from=2026-02-30')
    expect(await screen.findByRole('region', { name: 'November 2026' })).toBeInTheDocument()
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/sessions?status=finished&page=1&per_page=20')
  })

  it('offers no date filter while history is empty', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/sessions': sessionPage([]) })
    renderRoutes(routes, '/progress/history')

    expect(await screen.findByText('No workouts yet')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filter by date' })).not.toBeInTheDocument()
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
