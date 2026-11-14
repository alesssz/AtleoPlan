/*
 * The exercise editor: creating, changing, the form's own messages, the
 * server's messages, and an exercise that is not the user's.
 */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes, sentBody } from '@/test/auth-helpers'
import { fixedLists, testExercise } from '@/test/exercise-helpers'
import { ExerciseEditorPage } from './ExerciseEditorPage'

/** The editor's two routes, and a stand-in for the exercise's page. */
const routes = [
  { path: 'exercises', element: <p>the list</p> },
  { path: 'exercises/new', element: <ExerciseEditorPage /> },
  { path: 'exercises/:id', element: <p>the exercise page</p> },
  { path: 'exercises/:id/edit', element: <ExerciseEditorPage /> },
]

describe('ExerciseEditorPage', () => {
  it('creates an exercise from every field, then opens it', async () => {
    const fake = fakeApi({ ...fixedLists, 'POST /api/exercises': { status: 201, body: { data: testExercise({ id: 99, is_mine: true }) } } })
    const { router } = renderRoutes(routes, '/exercises/new')
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Name'), 'Panca mia')
    await user.type(screen.getByLabelText('Instructions'), 'Sdraiati.{Enter}Spingi.')
    // The selects' options arrive with the fixed lists
    await screen.findByRole('option', { name: 'Chest' })
    await user.selectOptions(screen.getByLabelText('Main muscle'), 'Chest')
    await user.selectOptions(screen.getByLabelText('Equipment'), 'Barbell')
    await user.selectOptions(screen.getByLabelText('Logged as'), 'Reps only')
    await user.click(screen.getByRole('checkbox', { name: 'Triceps' }))
    await user.click(screen.getByRole('button', { name: 'Create exercise' }))

    expect(await screen.findByText('the exercise page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/exercises/99')
    expect(sentBody(fake, '/api/exercises')).toEqual({
      name: 'Panca mia',
      description: null,
      instructions: ['Sdraiati.', 'Spingi.'],
      logging_type: 'reps',
      equipment_id: 1,
      youtube_url: null,
      muscles: [{ id: 6, role: 'primary' }, { id: 17, role: 'secondary' }],
    })
  })

  it('does not let the main muscle be ticked as secondary', async () => {
    fakeApi(fixedLists)
    renderRoutes(routes, '/exercises/new')

    await screen.findByRole('option', { name: 'Chest' })
    await userEvent.selectOptions(screen.getByLabelText('Main muscle'), 'Chest')

    expect(screen.getByRole('checkbox', { name: 'Chest' })).toBeDisabled()
  })

  it('starts with the name of the search that found nothing', async () => {
    fakeApi(fixedLists)
    renderRoutes(routes, '/exercises/new?name=panca%20mia')

    expect(screen.getByLabelText('Name')).toHaveValue('panca mia')
  })

  it('says what is wrong before sending anything', async () => {
    const fake = fakeApi(fixedLists)
    renderRoutes(routes, '/exercises/new')

    await userEvent.type(screen.getByLabelText('YouTube link'), 'https://vimeo.com/1')
    await userEvent.click(screen.getByRole('button', { name: 'Create exercise' }))

    expect(await screen.findByText('Write a name.')).toBeInTheDocument()
    expect(screen.getByText('Paste a YouTube link (youtube.com or youtu.be).')).toBeInTheDocument()
    expect(fake.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('shows the server\'s message under its field', async () => {
    fakeApi({ ...fixedLists, 'POST /api/exercises': { status: 422, body: { message: 'Invalid.', errors: { name: ['The name has already been taken.'] } } } })
    renderRoutes(routes, '/exercises/new')

    await userEvent.type(screen.getByLabelText('Name'), 'Panca')
    await userEvent.click(screen.getByRole('button', { name: 'Create exercise' }))

    expect(await screen.findByText('The name has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('changes an exercise, starting from its values', async () => {
    const mine = testExercise({ id: 13, name: 'Panca mia', is_mine: true })
    const fake = fakeApi({
      ...fixedLists,
      'GET /api/exercises/13': { status: 200, body: { data: mine } },
      'PATCH /api/exercises/13': { status: 200, body: { data: { ...mine, name: 'Panca stretta' } } },
    })
    const { router } = renderRoutes(routes, '/exercises/13/edit')

    // The form, filled in once the exercise has arrived
    const name = await screen.findByLabelText('Name')
    expect(name).toHaveValue('Panca mia')
    expect(screen.getByLabelText('Instructions')).toHaveValue('Lie on the bench.\nLower the bar to the chest.')

    await userEvent.clear(name)
    await userEvent.type(name, 'Panca stretta')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('the exercise page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/exercises/13')
    expect(sentBody(fake, '/api/exercises/13')).toMatchObject({ name: 'Panca stretta', equipment_id: 1 })
  })

  it('refuses to edit an exercise that is not the user\'s', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises/12': { status: 200, body: { data: testExercise() } } })
    renderRoutes(routes, '/exercises/12/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('Only your own exercises can be edited.')
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})
