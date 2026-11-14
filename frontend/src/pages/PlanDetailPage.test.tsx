/*
 * One plan's page: what it shows of each day, the day tabs kept in the address,
 * the actions (set as active, archive, restore, delete), and a plan that is not
 * there.
 */
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadActiveSession, storeActiveSession } from '@/components/workout/session-storage'
import { startSession } from '@/components/workout/workout-session'
import { fakeApi, renderRoutes, signedInAs, testUser } from '@/test/auth-helpers'
import { testPlan } from '@/test/plan-helpers'
import { PlanDetailPage } from './PlanDetailPage'

/** The page, and plain stand-ins for where its links go. */
const routes = [
  { path: 'plans', element: <p>the list</p> },
  { path: 'plans/:id', element: <PlanDetailPage /> },
  { path: 'exercises/:id', element: <p>an exercise</p> },
  { path: 'session/:id', element: <p>workout mode</p> },
]

/** The answer of GET /api/plans/plan-ppl: the test plan, changed as asked. */
function planAnswer(changes: Parameters<typeof testPlan>[0] = {}) {
  return { status: 200, body: { data: testPlan(changes) } }
}

/** A plan file, as the export answers: its content does not matter here. */
const planFile = { format: 'atleoplan.plan', version: 1, plan: { name: 'Push Pull Legs', days: [] }, exercises: [] }

afterEach(() => {
  // Put back what the export test replaced
  vi.restoreAllMocks()
})

describe('PlanDetailPage', () => {
  it('exports the plan as a file, named after it', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer(), 'GET /api/plans/plan-ppl/export': { status: 200, body: planFile } })
    // jsdom saves no file: the Blob's address and the link's click are
    // caught instead. createObjectURL does not exist in jsdom: given here
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:test'
    })
    URL.revokeObjectURL = vi.fn()
    // On the prototype, so the link made by the code is caught too; the spy
    // keeps it in mock.contexts
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {})
    renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Export' }))

    // The request comes first
    await vi.waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    // The link that was clicked, made by downloadJson()
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('push-pull-legs.atleoplan.json')
    expect(link.href).toBe('blob:test')
    expect(JSON.parse(await blobs[0]!.text())).toEqual(planFile)
  })

  it('says when it was just imported, and which exercises were created', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer() })
    // The list first, then the plan with the import's state, as the import does
    const { router } = renderRoutes(routes, '/plans')
    await act(() => router.navigate('/plans/plan-ppl', { state: { createdExercises: ['Frog stand', 'L-sit'] } }))

    expect(await screen.findByText('Plan imported. 2 exercises were missing and are now among yours: Frog stand, L-sit.')).toBeInTheDocument()
  })

  it('shows the first day: each exercise summed up, warm-ups apart, the superset joined', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer() })
    renderRoutes(routes, '/plans/plan-ppl')

    expect(await screen.findByRole('heading', { level: 1, name: 'Push Pull Legs' })).toBeInTheDocument()
    expect(screen.getByText('Hypertrophy')).toBeInTheDocument()
    expect(screen.getByText('Deload every fourth week.')).toBeInTheDocument()

    // The day tabs; the first is open
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(tab => tab.textContent)).toEqual(['Day A – Push', 'Day B – Legs'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    const day = screen.getByRole('tabpanel')
    expect(within(day).getByText('3 exercises · 7 sets')).toBeInTheDocument()
    // The bench press: its line, its warm-ups, its notes, a link to it
    expect(within(day).getByText(/4 × 8–10 · 80 kg · 90 sec/)).toBeInTheDocument()
    expect(within(day).getByText('+ 2 warm-up')).toBeInTheDocument()
    expect(within(day).getByText('Shoulder blades back')).toBeInTheDocument()
    expect(within(day).getByRole('link', { name: 'Barbell Bench Press' })).toHaveAttribute('href', '/exercises/12')

    // The superset: a region named so, holding its two exercises. The rows
    // have no rest of their own, so the user's default (90 s) is shown
    const superset = within(day).getByRole('region', { name: 'Superset' })
    expect(within(superset).getAllByRole('link').map(link => link.textContent)).toEqual(['Bent Over Barbell Row', 'Pullups'])
    expect(within(superset).getByText('2 × 10/8 · 60–70 kg · 90 sec')).toBeInTheDocument()
    // Pull-ups to failure with no target: the sets are only counted
    expect(within(superset).getByText('1 set · 90 sec')).toBeInTheDocument()
  })

  it('opens another day, and keeps it in the address', async () => {
    const { router } = renderPlan()

    await userEvent.click(await screen.findByRole('tab', { name: 'Day B – Legs' }))

    expect(within(screen.getByRole('tabpanel')).getByRole('link', { name: 'Barbell Squat' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?day=2')
  })

  it('opens the day named in the address', async () => {
    renderPlan('/plans/plan-ppl?day=2')

    expect(await screen.findByRole('tab', { name: 'Day B – Legs' })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the first day when the address names one that does not exist', async () => {
    renderPlan('/plans/plan-ppl?day=9')

    expect(await screen.findByRole('tab', { name: 'Day A – Push' })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the weights in the user\'s unit', async () => {
    fakeApi({ 'GET /api/user': signedInAs({ ...testUser, weight_unit: 'lb' }), 'GET /api/plans/plan-ppl': planAnswer() })
    renderRoutes(routes, '/plans/plan-ppl')

    expect(await screen.findByText(/4 × 8–10 · 176.37 lb · 90 sec/)).toBeInTheDocument()
  })

  it('makes the plan active, then shows it so', async () => {
    // A function as the answer: the plan is active once the POST has arrived
    let active = false
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': () => planAnswer({ is_active: active }),
      'POST /api/plans/plan-ppl/activate': () => {
        active = true
        return { status: 200, body: { data: {} } }
      },
    })
    renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Set as active' }))

    // The plan was read again: the Active badge, and no button to set it
    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set as active' })).not.toBeInTheDocument()
    expect(fake.mock.calls.some(([path, init]) => path === '/api/plans/plan-ppl/activate' && init?.method === 'POST')).toBe(true)
  })

  it('archives the plan, and offers to restore it', async () => {
    let archivedAt: string | null = null
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': () => planAnswer({ archived_at: archivedAt }),
      'POST /api/plans/plan-ppl/archive': () => {
        archivedAt = '2026-11-07T10:00:00.000000Z'
        return { status: 200, body: { data: {} } }
      },
    })
    renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Archive' }))

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    // An archived plan cannot be made active
    expect(screen.queryByRole('button', { name: 'Set as active' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All plans' })).toHaveAttribute('href', '/plans?archived=1')
  })

  it('says so when an action fails', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer(), 'POST /api/plans/plan-ppl/archive': { status: 500 } })
    renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Archive' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The plan could not be changed. Try again.')
  })

  it('deletes the plan after confirming, then opens the list', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer() })
    const { router } = renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete «Push Pull Legs»?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('the list')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans')
    expect(fake.mock.calls.some(([path, init]) => path === '/api/plans/plan-ppl' && init?.method === 'DELETE')).toBe(true)
  })

  it('opens the editor with Edit', async () => {
    renderPlan()

    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/plans/plan-ppl/edit')
  })

  it('starts a workout of the open day, with last time\'s sets, and opens workout mode', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': planAnswer(),
      'GET /api/sessions/last-sets': { status: 200, body: { data: [] } },
    })
    const { router } = renderRoutes(routes, '/plans/plan-ppl')

    await userEvent.click(await screen.findByRole('button', { name: 'Start this day' }))

    expect(await screen.findByText('workout mode')).toBeInTheDocument()
    const session = loadActiveSession()
    expect(router.state.location.pathname).toBe(`/session/${session?.id}`)
    expect(session?.day_name).toBe('Day A – Push')
    // Last time was asked for the day's three exercises
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/sessions/last-sets?exercises=12,30,31')
  })

  it('offers to resume a workout in progress, and does not start another', async () => {
    const plan = testPlan()
    const session = startSession(plan, plan.days[1]!, { unit: 'kg', defaultRestSeconds: 90, lastSets: [], language: 'en', now: new Date() })
    storeActiveSession(session)
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer() })
    renderRoutes(routes, '/plans/plan-ppl')

    expect(await screen.findByText('Workout in progress: Day B – Legs')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', `/session/${session.id}`)
    expect(screen.getByRole('button', { name: 'Start this day' })).toBeDisabled()
  })

  it('says so for a plan that is not there, or not the user\'s', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-gone': { status: 404, body: { message: 'Not found.' } } })
    renderRoutes(routes, '/plans/plan-gone')

    expect(await screen.findByRole('alert')).toHaveTextContent('This plan does not exist, or it is not yours.')
    expect(screen.getByRole('link', { name: 'All plans' })).toHaveAttribute('href', '/plans')
  })
})

/**
 * Draws the test plan's page, the plan and the user answered by the fake API.
 */
function renderPlan(path = '/plans/plan-ppl') {
  fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': planAnswer() })
  return renderRoutes(routes, path)
}
