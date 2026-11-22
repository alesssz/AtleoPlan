import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes } from '@/test/auth-helpers'
import { testExercise } from '@/test/exercise-helpers'
import { testPlan, testPlanItem, testPlanSummary } from '@/test/plan-helpers'
import { ExerciseDetailPage } from './ExerciseDetailPage'

const routes = [
  { path: 'exercises', element: <p>the list</p> },
  { path: 'exercises/:id', element: <ExerciseDetailPage /> },
  { path: 'exercises/:id/edit', element: <p>the editor</p> },
  { path: 'plans/new', element: <p>the new plan</p> },
  { path: 'plans/:id/edit', element: <p>the plan editor</p> },
]

describe('ExerciseDetailPage', () => {
  it('shows the photos, the facts, the muscles and the steps', async () => {
    fakeApi({ 'GET /api/exercises/12': { status: 200, body: { data: testExercise() } } })
    renderRoutes(routes, '/exercises/12')

    expect(await screen.findByRole('heading', { level: 1, name: 'Barbell Bench Press' })).toBeInTheDocument()
    // The large copy (url), not the thumbnail
    expect(screen.getByRole('img', { name: 'Barbell Bench Press, photo 1' })).toHaveAttribute('src', '/storage/1/conversions/0-large.webp')
    expect(screen.getByRole('img', { name: 'Barbell Bench Press, photo 2' })).toBeInTheDocument()
    expect(screen.getByText('Equipment').nextElementSibling).toHaveTextContent('Barbell')
    expect(screen.getByText('Logged as').nextElementSibling).toHaveTextContent('Weight × reps')
    expect(screen.getByText('Main muscles').nextElementSibling).toHaveTextContent('Chest')
    expect(screen.getByText('Secondary muscles').nextElementSibling).toHaveTextContent('Triceps')
    const steps = within(screen.getByRole('region', { name: 'How to do it' })).getAllByRole('listitem')
    expect(steps.map(step => step.textContent)).toEqual(['Lie on the bench.', 'Lower the bar to the chest.'])
    // A public exercise: no owner's actions
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('lets the owner edit, and delete after confirming', async () => {
    const fake = fakeApi({ 'GET /api/exercises/13': { status: 200, body: { data: testExercise({ id: 13, name: 'Panca mia', is_mine: true }) } } })
    const { router } = renderRoutes(routes, '/exercises/13')

    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/exercises/13/edit')

    // The first Delete only opens the dialog
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete «Panca mia»?' })
    expect(fake.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)

    // The dialog's Delete sends the request, then goes to the list
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('the list')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/exercises')
    expect(fake.mock.calls.some(([path, init]) => path === '/api/exercises/13' && init?.method === 'DELETE')).toBe(true)
  })

  it('keeps the exercise when the dialog is cancelled', async () => {
    const fake = fakeApi({ 'GET /api/exercises/13': { status: 200, body: { data: testExercise({ id: 13, is_mine: true }) } } })
    renderRoutes(routes, '/exercises/13')

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(fake.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })

  it('says so for an exercise that is not there, or not the user\'s', async () => {
    fakeApi({ 'GET /api/exercises/99': { status: 404, body: { message: 'Not found.' } } })
    renderRoutes(routes, '/exercises/99')

    expect(await screen.findByRole('alert')).toHaveTextContent('This exercise does not exist, or it is not yours.')
    expect(screen.getByRole('link', { name: 'All exercises' })).toHaveAttribute('href', '/exercises')
  })
  it('adds the exercise to a plan\'s day through the plan\'s editor', async () => {
    // Day A already has the bench press; Day B is full
    const plan = testPlan()
    plan.days[1]!.items = Array.from({ length: 30 }, (_, index) => testPlanItem({ id: `item-${index}`, exercise_id: 40 }))
    fakeApi({
      'GET /api/exercises/12': { status: 200, body: { data: testExercise() } },
      'GET /api/plans': { status: 200, body: { data: [testPlanSummary({ days_count: 2 }), testPlanSummary({ id: 'plan-full-body', name: 'Full body', is_active: false, days_count: 1 })] } },
      'GET /api/plans/plan-ppl': { status: 200, body: { data: plan } },
    })
    const { router } = renderRoutes(routes, '/exercises/12')

    await userEvent.click(await screen.findByRole('button', { name: 'Add to plan' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add to a plan' })
    expect(within(dialog).getByRole('link', { name: 'New plan with this exercise' })).toHaveAttribute('href', '/plans/new?add=12&day=1')

    await userEvent.click(await within(dialog).findByRole('button', { name: /^Push Pull Legs/ }))

    expect(await screen.findByRole('dialog', { name: 'Which day of «Push Pull Legs»?' })).toBeInTheDocument()
    const dayA = await within(dialog).findByRole('link', { name: /^Day A – Push/ })
    expect(dayA).toHaveTextContent('3 exercises · Already in it')
    expect(within(dialog).queryByRole('link', { name: /^Day B/ })).not.toBeInTheDocument()
    expect(within(dialog).getByText('Day B – Legs').closest('[aria-disabled]')).toHaveTextContent('Full: 30 exercises')

    await userEvent.click(dayA)
    expect(await screen.findByText('the plan editor')).toBeInTheDocument()
    expect(router.state.location.pathname + router.state.location.search).toBe('/plans/plan-ppl/edit?add=12&day=1')
  })

  it('offers a new plan when there is none', async () => {
    fakeApi({
      'GET /api/exercises/12': { status: 200, body: { data: testExercise() } },
      'GET /api/plans': { status: 200, body: { data: [] } },
    })
    renderRoutes(routes, '/exercises/12')

    await userEvent.click(await screen.findByRole('button', { name: 'Add to plan' }))

    expect(await screen.findByText('You have no plans yet.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'New plan with this exercise' }))
    expect(await screen.findByText('the new plan')).toBeInTheDocument()
  })
})
