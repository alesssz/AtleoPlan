/*
 * The plan editor (docs/design/D1-ui.md D1.4.8): creating a plan from the
 * library, changing a saved one, the rules before sending, the server's
 * messages, the warning of a plan changed elsewhere, the draft kept between
 * visits, supersets and days. What the editor sends is read from the fake
 * API (sentBody, src/test/auth-helpers.tsx).
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PlanInput } from '@/api/plans'
import { fakeApi, renderRoutes, sentBody, signedInAs } from '@/test/auth-helpers'
import { exercisePage, testExercise } from '@/test/exercise-helpers'
import { testPlan } from '@/test/plan-helpers'
import { PlanDetailPage } from './PlanDetailPage'
import { PlanEditorPage } from './PlanEditorPage'

/** The editor's two routes, and a stand-in for the plan's page. */
const routes = [
  { path: 'plans', element: <p>the list</p> },
  { path: 'plans/new', element: <PlanEditorPage /> },
  { path: 'plans/:id', element: <p>the plan page</p> },
  { path: 'plans/:id/edit', element: <PlanEditorPage /> },
]

/** The library's answer: the bench press and a squat. */
const library = exercisePage([testExercise(), testExercise({ id: 40, name: 'Barbell Squat', photos: [] })])

/** The answer of GET /api/plans/plan-ppl: the test plan. */
const savedPlan = { status: 200, body: { data: testPlan() } }

describe('PlanEditorPage', () => {
  it('creates a plan from exercises chosen in the library, then opens it', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/exercises': library,
      'POST /api/plans': { status: 201, body: { data: testPlan({ id: 'plan-new' }) } },
    })
    const { router } = renderRoutes(routes, '/plans/new')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Name'), 'My plan')

    // The library's select mode: tick two exercises, then Add (2)
    await user.click(screen.getByRole('button', { name: 'Add exercises' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add exercises' })
    await user.click(await within(dialog).findByRole('checkbox', { name: 'Choose Barbell Bench Press' }))
    await user.click(within(dialog).getByRole('checkbox', { name: 'Choose Barbell Squat' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add (2)' }))

    // Open the bench press: its row's button starts with its name
    await user.click(screen.getByRole('button', { name: /^Barbell Bench Press/ }))
    // Set 1 becomes a warm-up at 40 kg; set 2 asks for 82,5 kg at RPE 8
    await user.click(screen.getByRole('button', { name: 'Set 1, normal: tap to change the type' }))
    await user.type(screen.getByLabelText('Set 1, Weight (kg)'), '40')
    await user.type(screen.getByLabelText('Set 2, Weight (kg)'), '82,5')
    await user.type(screen.getByLabelText('Set 2, RPE'), '8')
    await user.click(screen.getByRole('button', { name: 'Create plan' }))

    expect(await screen.findByText('the plan page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans/plan-new')
    const body = sentBody(fake, '/api/plans') as PlanInput
    expect(body).not.toHaveProperty('version')
    expect(body.name).toBe('My plan')
    expect(body.days.map(day => day.name)).toEqual(['Day A'])
    expect(body.days[0]?.items.map(item => item.exercise_id)).toEqual([12, 40])
    expect(body.days[0]?.items[0]?.sets.slice(0, 2)).toEqual([
      { set_type: 'warm_up', target_reps_min: 8, target_reps_max: 10, target_weight_kg: 40, target_rpe: null, target_duration_seconds: null, target_distance_meters: null },
      { set_type: 'normal', target_reps_min: 8, target_reps_max: 10, target_weight_kg: 82.5, target_rpe: 8, target_duration_seconds: null, target_distance_meters: null },
    ])
    // Saved: the draft is no longer kept
    expect(localStorage.getItem('atleoplan.planDraft.new')).toBeNull()
  })

  it('says what is wrong before sending anything', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs() })
    renderRoutes(routes, '/plans/new')

    await userEvent.click(await screen.findByRole('button', { name: 'Create plan' }))

    expect(await screen.findByText('Write a name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Some fields need fixing: they are marked in red.')).toBeInTheDocument()
    expect(fake.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('shows the server\'s message under its field', async () => {
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': { status: 422, body: { message: 'Invalid.', errors: { 'days.0.items.0.sets.2.target_reps_max': ['The maximum reps field must be greater than or equal to 8.'] } } },
    })
    renderRoutes(routes, '/plans/plan-ppl/edit')

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))

    // The bench press, the first exercise, is outlined; open it to read the message
    await userEvent.click(screen.getByRole('button', { name: /^Barbell Bench Press/ }))
    expect(screen.getByText('The maximum reps field must be greater than or equal to 8.')).toBeInTheDocument()
    expect(screen.getByLabelText('Set 3, Reps')).toHaveAttribute('aria-invalid', 'true')
  })

  it('saves a plan again with its version and its ids', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': { status: 200, body: { data: testPlan(), meta: { changed_elsewhere: false } } },
    })
    const { router } = renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    // The form starts from the plan
    const name = await screen.findByLabelText('Name')
    expect(name).toHaveValue('Push Pull Legs')
    await user.clear(name)
    await user.type(name, 'PPL')
    await user.click(screen.getByRole('button', { name: /^Barbell Bench Press/ }))
    await user.type(screen.getByLabelText('Rest (seconds)'), '{Control>}a{/Control}150')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('the plan page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plans/plan-ppl')
    const body = sentBody(fake, '/api/plans/plan-ppl') as PlanInput
    expect(body.version).toBe(3)
    expect(body.name).toBe('PPL')
    expect(body.days.map(day => day.id)).toEqual(['day-a', 'day-b'])
    expect(body.days[0]?.items.map(item => [item.id, item.superset_group, item.rest_seconds])).toEqual([
      ['item-bench', null, 150],
      ['item-row', 1, null],
      ['item-pullup', 1, 90],
    ])
  })

  it('warns on the plan\'s page when the plan had been changed elsewhere', async () => {
    fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': { status: 200, body: { data: testPlan(), meta: { changed_elsewhere: true } } },
    })
    // The real plan page this time, which reads the warning
    renderRoutes([...routes.filter(route => route.path !== 'plans/:id'), { path: 'plans/:id', element: <PlanDetailPage /> }], '/plans/plan-ppl/edit')

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))

    expect(await screen.findByText('This plan was changed somewhere else in the meantime. Your version was saved over it.')).toBeInTheDocument()
  })

  it('keeps the draft when leaving, and discards it on request', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': savedPlan })
    const first = renderRoutes(routes, '/plans/plan-ppl/edit')
    await userEvent.type(await screen.findByLabelText('Goal'), ' and strength')
    // Leaving the editor: it disappears from the page
    first.unmount()

    // Coming back: the change is there, and so is the way to drop it
    renderRoutes(routes, '/plans/plan-ppl/edit')
    expect(await screen.findByLabelText('Goal')).toHaveValue('Hypertrophy and strength')
    expect(screen.getByText('Your unsaved changes are back: save them, or discard them.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))

    expect(screen.getByLabelText('Goal')).toHaveValue('Hypertrophy')
    expect(localStorage.getItem('atleoplan.planDraft.plan-ppl')).toBeNull()
  })

  it('joins two exercises in a superset', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': { status: 200, body: { data: testPlan(), meta: { changed_elsewhere: false } } },
    })
    renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    // Day A: the bench press, then the rows and the pull-ups in superset 1.
    // The bench press and the rows become a superset: the pull-ups are left alone
    await user.click(await screen.findByRole('button', { name: 'Make a superset' }))
    await user.click(screen.getByRole('checkbox', { name: 'Choose Barbell Bench Press' }))
    await user.click(screen.getByRole('checkbox', { name: 'Choose Bent Over Barbell Row' }))
    await user.click(screen.getByRole('button', { name: 'Join in superset (2)' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText('the plan page')
    const body = sentBody(fake, '/api/plans/plan-ppl') as PlanInput
    expect(body.days[0]?.items.map(item => [item.id, item.superset_group])).toEqual([
      ['item-bench', 1],
      ['item-row', 1],
      ['item-pullup', null],
    ])
  })

  it('adds a day named with the next letter, and opens it', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': savedPlan })
    renderRoutes(routes, '/plans/plan-ppl/edit')

    await userEvent.click(await screen.findByRole('button', { name: 'Add day' }))

    expect(screen.getByRole('tab', { name: 'Day C' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Day name')).toHaveValue('Day C')
    expect(screen.getByText('No exercises yet: add them from the library.')).toBeInTheDocument()
  })
})
