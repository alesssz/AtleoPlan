/*
 * One exercise's page: what it shows, the owner's actions, deleting with a
 * confirmation, and an exercise that is not there.
 */
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes } from '@/test/auth-helpers'
import { testExercise } from '@/test/exercise-helpers'
import { ExerciseDetailPage } from './ExerciseDetailPage'

/** The page, and plain stand-ins for where its links go. */
const routes = [
  { path: 'exercises', element: <p>the list</p> },
  { path: 'exercises/:id', element: <ExerciseDetailPage /> },
  { path: 'exercises/:id/edit', element: <p>the editor</p> },
]

describe('ExerciseDetailPage', () => {
  it('shows the photos, the facts, the muscles and the steps', async () => {
    fakeApi({ 'GET /api/exercises/12': { status: 200, body: { data: testExercise() } } })
    renderRoutes(routes, '/exercises/12')

    expect(await screen.findByRole('heading', { level: 1, name: 'Barbell Bench Press' })).toBeInTheDocument()
    // The photos, each with its text alternative, from their large copy (url)
    expect(screen.getByRole('img', { name: 'Barbell Bench Press, photo 1' })).toHaveAttribute('src', '/storage/1/conversions/0-large.webp')
    expect(screen.getByRole('img', { name: 'Barbell Bench Press, photo 2' })).toBeInTheDocument()
    // The facts: each term is followed by its value
    expect(screen.getByText('Equipment').nextElementSibling).toHaveTextContent('Barbell')
    expect(screen.getByText('Logged as').nextElementSibling).toHaveTextContent('Weight × reps')
    expect(screen.getByText('Main muscles').nextElementSibling).toHaveTextContent('Chest')
    expect(screen.getByText('Secondary muscles').nextElementSibling).toHaveTextContent('Triceps')
    // The steps, in order. A <section> named by its heading
    // (aria-labelledby) is a "region"
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
})
