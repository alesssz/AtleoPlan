/*
 * The plan list (docs/design/D1-ui.md D1.4.6): the cards, the two views kept
 * in the address, and the empty and error states (D1.6). The API is
 * fakeApi's table (src/test/auth-helpers.tsx).
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes } from '@/test/auth-helpers'
import { testPlanSummary } from '@/test/plan-helpers'
import { PlansPage } from './PlansPage'

/** The list, and a stand-in for the plan page its cards open. */
const routes = [
  { path: 'plans', element: <PlansPage /> },
  { path: 'plans/:id', element: <p>a plan</p> },
]

describe('PlansPage', () => {
  it('shows each plan as a card: name, goal, days, when it was last used, and the Active badge', async () => {
    // Used yesterday at noon, by the device's clock: always "yesterday"
    const now = new Date()
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12).toISOString()
    fakeApi({
      'GET /api/plans': { status: 200, body: { data: [
        testPlanSummary({ last_used_at: yesterday }),
        testPlanSummary({ id: 'plan-fb', name: 'Full body', goal: null, is_active: false, days_count: 1, last_used_at: null }),
      ] } },
    })
    renderRoutes(routes, '/plans')

    // The whole card is a link, named by its text
    const active = await screen.findByRole('link', { name: /Push Pull Legs/ })
    expect(active).toHaveAttribute('href', '/plans/plan-ppl')
    expect(within(active).getByText('Active')).toBeInTheDocument()
    expect(within(active).getByText('Hypertrophy')).toBeInTheDocument()
    expect(within(active).getByText('3 days')).toBeInTheDocument()
    expect(within(active).getByText('Used yesterday')).toBeInTheDocument()

    const other = screen.getByRole('link', { name: /Full body/ })
    expect(within(other).queryByText('Active')).not.toBeInTheDocument()
    expect(within(other).getByText('1 day')).toBeInTheDocument()
    expect(within(other).getByText('Never used yet')).toBeInTheDocument()
  })

  it('switches to the archived plans, in the address and in the request', async () => {
    const fake = fakeApi({
      'GET /api/plans': { status: 200, body: { data: [testPlanSummary()] } },
      'GET /api/plans?archived=1': { status: 200, body: { data: [testPlanSummary({ id: 'plan-old', name: 'Old plan', is_active: false })] } },
    })
    const { router } = renderRoutes(routes, '/plans')

    await screen.findByRole('link', { name: /Push Pull Legs/ })
    await userEvent.click(screen.getByRole('button', { name: 'Archived' }))

    expect(await screen.findByRole('link', { name: /Old plan/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archived' })).toHaveAttribute('aria-pressed', 'true')
    expect(router.state.location.search).toBe('?archived=1')
    expect(fake.mock.calls.map(([path]) => path)).toContain('/api/plans?archived=1')
  })

  it('invites to create the first plan', async () => {
    fakeApi({ 'GET /api/plans': { status: 200, body: { data: [] } } })
    renderRoutes(routes, '/plans')

    expect(await screen.findByRole('heading', { name: 'Create your first plan' })).toBeInTheDocument()
    // Two New plan links, at the top and in the empty state: both open the editor
    for (const link of screen.getAllByRole('link', { name: 'New plan' })) expect(link).toHaveAttribute('href', '/plans/new')
  })

  it('says so when there is no archived plan', async () => {
    fakeApi({ 'GET /api/plans?archived=1': { status: 200, body: { data: [] } } })
    renderRoutes(routes, '/plans?archived=1')

    expect(await screen.findByRole('heading', { name: 'No archived plans' })).toBeInTheDocument()
  })

  it('says so when the list cannot be loaded, with a way to try again', async () => {
    fakeApi({ 'GET /api/plans': { status: 500 } })
    renderRoutes(routes, '/plans')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The plans could not be loaded.')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
