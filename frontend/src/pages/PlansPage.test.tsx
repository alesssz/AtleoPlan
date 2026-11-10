/*
 * The plan list (docs/design/D1-ui.md D1.4.6): the cards, the two views kept
 * in the address, and the empty and error states (D1.6). The API is
 * fakeApi's table (src/test/auth-helpers.tsx).
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes, sentBody } from '@/test/auth-helpers'
import { testPlan, testPlanSummary } from '@/test/plan-helpers'
import { PlansPage } from './PlansPage'

/** The list, and a stand-in for the plan page its cards open. */
const routes = [
  { path: 'plans', element: <PlansPage /> },
  { path: 'plans/:id', element: <p>a plan</p> },
]

/** A plan file, as a plan's Export saves it. */
const planFile = { format: 'atleoplan.plan', version: 1, plan: { name: 'Calisthenics', days: [] }, exercises: [] }

/**
 * The file input of Import plan: hidden, so not found by role.
 * `!`: the test fails at once if it is not there.
 */
function fileInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>('input[type=file]')!
}

describe('PlansPage', () => {
  it('imports a plan file: sent as it is, then the new plan opens', async () => {
    const fake = fakeApi({
      'GET /api/plans': { status: 200, body: { data: [] } },
      'POST /api/plans/import': { status: 201, body: { data: testPlan({ id: 'plan-new' }), meta: { created_exercises: [] } } },
    })
    const { router } = renderRoutes(routes, '/plans')
    const user = userEvent.setup()

    // upload(): what choosing a file in the browser's picker does
    await screen.findByRole('button', { name: 'Import plan' })
    await user.upload(fileInput(), new File([JSON.stringify(planFile)], 'calisthenics.atleoplan.json', { type: 'application/json' }))

    expect(await screen.findByText('a plan')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans/plan-new')
    expect(sentBody(fake, '/api/plans/import')).toEqual(planFile)
  })

  it('says so when the file is not a plan: not JSON, or refused by the server', async () => {
    const fake = fakeApi({
      'GET /api/plans': { status: 200, body: { data: [] } },
      'POST /api/plans/import': { status: 422, body: { message: 'Invalid.', errors: { format: ['The selected format is invalid.'] } } },
    })
    renderRoutes(routes, '/plans')
    const user = userEvent.setup()
    await screen.findByRole('button', { name: 'Import plan' })

    // Not JSON at all: nothing is sent. A .json name, or upload() would
    // refuse it as the browser's picker does, by the input's `accept`
    await user.upload(fileInput(), new File(['name;sets'], 'plan.json', { type: 'application/json' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This file is not a plan exported from AtleoPlan.')

    // JSON, but refused (422)
    await user.upload(fileInput(), new File([JSON.stringify({ format: 'something else' })], 'other.json', { type: 'application/json' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This file is not a plan exported from AtleoPlan.')
    // Only the second reached the server
    expect(fake.mock.calls.filter(([path]) => path === '/api/plans/import')).toHaveLength(1)
  })

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
