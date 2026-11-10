/*
 * The plan editor (docs/design/D1-ui.md D1.4.8): creating a plan from the
 * library, changing a saved one, the rules before sending, the server's
 * messages, the warning of a plan changed elsewhere, the draft kept between
 * visits, supersets, the number of days, the two steps (the plan's details,
 * then the days as tabs) with the history's Back between them, and an
 * exercise created from the picker.
 * What the editor sends is read from the fake API (sentBody,
 * src/test/auth-helpers.tsx).
 */
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PlanInput } from '@/api/plans'
import { fakeApi, renderRoutes, sentBody, signedInAs } from '@/test/auth-helpers'
import { exercisePage, fixedLists, testExercise } from '@/test/exercise-helpers'
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

/** The answer of PUT /api/plans/plan-ppl: saved, changed nowhere else. */
const savedAgain = { status: 200, body: { data: testPlan(), meta: { changed_elsewhere: false } } }

describe('PlanEditorPage', () => {
  it('creates a plan from exercises chosen in the library, then opens it', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/exercises': library,
      'POST /api/plans': { status: 201, body: { data: testPlan({ id: 'plan-new' }) } },
    })
    // The list first, then the editor, as a person gets there: the history
    // then has an entry before the editor, for Back at the end
    const { router } = renderRoutes(routes, '/plans')
    await act(() => router.navigate('/plans/new'))
    const user = userEvent.setup()

    // The first step: a name, then on to the exercises
    await user.type(await screen.findByLabelText('Name'), 'My plan')
    await user.click(screen.getByRole('button', { name: 'Next: the exercises' }))
    expect(screen.getByRole('tab', { name: 'Day A' })).toHaveAttribute('aria-selected', 'true')
    expect(router.state.location.search).toBe('?day=1')

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

    // Back from the plan's page goes to the list: the editor's two entries
    // (the details, the exercises) are gone from the history
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/plans')
  })

  it('creates an exercise from the picker\'s search, and puts it in the day', async () => {
    const fake = fakeApi({
      ...fixedLists,
      'GET /api/user': signedInAs(),
      // The search finds nothing
      'GET /api/exercises': exercisePage([]),
      'POST /api/exercises': { status: 201, body: { data: testExercise({ id: 77, name: 'Frog stand', logging_type: 'time', photos: [], is_mine: true }) } },
      'POST /api/plans': { status: 201, body: { data: testPlan({ id: 'plan-new' }) } },
    })
    renderRoutes(routes, '/plans/new')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Name'), 'Calisthenics')
    await user.click(screen.getByRole('button', { name: 'Next: the exercises' }))
    await user.click(screen.getByRole('button', { name: 'Add exercises' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add exercises' })
    await user.type(within(dialog).getByRole('searchbox', { name: 'Search exercises' }), 'frog stand')

    // Nothing found: the form, inside the window, with the search as the name
    await user.click(await within(dialog).findByRole('button', { name: 'Create «frog stand»' }))
    expect(within(dialog).getByLabelText('Name')).toHaveValue('frog stand')
    await user.selectOptions(within(dialog).getByLabelText('Logged as'), 'Time')
    await user.click(within(dialog).getByRole('button', { name: 'Create exercise' }))

    // The window closes, and the new exercise is in Day A
    expect(await screen.findByRole('button', { name: /^Frog stand/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const created = sentBody(fake, '/api/exercises') as { name: string, logging_type: string }
    expect(created.name).toBe('frog stand')
    expect(created.logging_type).toBe('time')

    await user.click(screen.getByRole('button', { name: 'Create plan' }))
    await screen.findByText('the plan page')
    const body = sentBody(fake, '/api/plans') as PlanInput
    expect(body.days[0]?.items.map(item => item.exercise_id)).toEqual([77])
  })

  it('says what is wrong before sending anything, in the first step', async () => {
    const fake = fakeApi({ 'GET /api/user': signedInAs() })
    const { router } = renderRoutes(routes, '/plans/new')
    const user = userEvent.setup()

    // Saving from the exercises, with no name: the first step comes back,
    // since the name is there
    await user.click(await screen.findByRole('button', { name: 'Next: the exercises' }))
    await user.click(screen.getByRole('button', { name: 'Create plan' }))

    expect(await screen.findByText('Write a name.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
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
    const { router } = renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Save' }))

    // The error is in Day A's exercises: the editor opens its tab, which
    // carries a red dot, named for screen readers
    const tab = await screen.findByRole('tab', { name: /^Day A – Push/ })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(within(tab).getByText('Some fields need fixing: they are marked in red.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?day=1')
    // The bench press, the first exercise, is outlined; open it to read the message
    await user.click(screen.getByRole('button', { name: /^Barbell Bench Press/ }))
    expect(screen.getByText('The maximum reps field must be greater than or equal to 8.')).toBeInTheDocument()
    expect(screen.getByLabelText('Set 3, Reps')).toHaveAttribute('aria-invalid', 'true')
  })

  it('saves a plan again with its version and its ids', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': savedAgain,
    })
    const { router } = renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    // The form starts from the plan
    const name = await screen.findByLabelText('Name')
    expect(name).toHaveValue('Push Pull Legs')
    await user.clear(name)
    await user.type(name, 'PPL')
    // On to the exercises, then the bench press
    await user.click(screen.getByRole('button', { name: 'Next: the exercises' }))
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
      'PUT /api/plans/plan-ppl': savedAgain,
    })
    renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    // Day A: the bench press, then the rows and the pull-ups in superset 1.
    // The bench press and the rows become a superset: the pull-ups are left alone
    await user.click(await screen.findByRole('button', { name: 'Next: the exercises' }))
    await user.click(screen.getByRole('button', { name: 'Make a superset' }))
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

  it('sets the number of days, naming the new ones with the next letters', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': savedPlan })
    renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    // Two days, then four: Day C and Day D, empty
    expect(await screen.findByLabelText('Number of days')).toHaveValue('2')
    await user.selectOptions(screen.getByLabelText('Number of days'), '4')

    expect(screen.getByLabelText('Name of day 3')).toHaveValue('Day C')
    expect(screen.getByLabelText('Name of day 4')).toHaveValue('Day D')
    await user.click(screen.getByRole('button', { name: 'Next: the exercises' }))
    await user.click(screen.getByRole('tab', { name: 'Day D' }))
    expect(screen.getByText('No exercises yet: add them from the library.')).toBeInTheDocument()

    // Back to three: Day D is empty, so it goes without a question
    await user.click(screen.getByRole('button', { name: 'Back to the plan\'s details' }))
    await user.selectOptions(screen.getByLabelText('Number of days'), '3')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Name of day 4')).not.toBeInTheDocument()
  })

  it('asks before removing days that have exercises', async () => {
    const fake = fakeApi({
      'GET /api/user': signedInAs(),
      'GET /api/plans/plan-ppl': savedPlan,
      'PUT /api/plans/plan-ppl': savedAgain,
    })
    renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()
    const count = await screen.findByLabelText('Number of days')

    // One day would remove Day B, which has the squat: the dialog asks.
    // Cancel keeps both days
    await user.selectOptions(count, '1')
    const dialog = await screen.findByRole('alertdialog', { name: 'Remove Day B – Legs?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(count).toHaveValue('2')
    expect(screen.getByLabelText('Name of day 2')).toHaveValue('Day B – Legs')

    // Asked again, and confirmed: Day B goes
    await user.selectOptions(count, '1')
    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(screen.queryByLabelText('Name of day 2')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText('the plan page')
    const body = sentBody(fake, '/api/plans/plan-ppl') as PlanInput
    expect(body.days.map(day => day.id)).toEqual(['day-a'])
  })

  it('goes from tab to tab, and Back returns to the first step', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': savedPlan })
    const { router } = renderRoutes(routes, '/plans/plan-ppl/edit')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Next: the exercises' }))
    expect(screen.getByRole('tab', { name: 'Day A – Push' })).toHaveAttribute('aria-selected', 'true')

    // Another tab replaces the first in the history
    await user.click(screen.getByRole('tab', { name: 'Day B – Legs' }))
    expect(screen.getByRole('tab', { name: 'Day B – Legs' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /^Barbell Squat/ })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?day=2')

    // The history's Back (the phone's button): the details, not Day A
    await act(() => router.navigate(-1))
    expect(screen.getByLabelText('Name')).toHaveValue('Push Pull Legs')
    expect(router.state.location.search).toBe('')

    // The step's own way back does the same
    await user.click(screen.getByRole('button', { name: 'Next: the exercises' }))
    await user.click(screen.getByRole('button', { name: 'Back to the plan\'s details' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Push Pull Legs')
    expect(router.state.location.pathname).toBe('/plans/plan-ppl/edit')
  })

  it('opens a day\'s tab from the address, and the first step for a day that does not exist', async () => {
    fakeApi({ 'GET /api/user': signedInAs(), 'GET /api/plans/plan-ppl': savedPlan })
    const first = renderRoutes(routes, '/plans/plan-ppl/edit?day=2')
    expect(await screen.findByRole('tab', { name: 'Day B – Legs' })).toHaveAttribute('aria-selected', 'true')

    // Opened by its address, not from the first step: the way back
    // replaces the entry instead of going back in the history
    await userEvent.click(screen.getByRole('button', { name: 'Back to the plan\'s details' }))
    expect(first.router.state.location.search).toBe('')
    expect(first.router.state.location.pathname).toBe('/plans/plan-ppl/edit')
    first.unmount()

    renderRoutes(routes, '/plans/plan-ppl/edit?day=9')
    expect(await screen.findByLabelText('Name')).toHaveValue('Push Pull Legs')
  })
})
