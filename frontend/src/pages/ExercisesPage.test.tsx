/*
 * The library's list: what it shows, what it asks the server for (search,
 * filters, pages), and its empty and error states. The API is fakeApi's table
 * (src/test/auth-helpers.tsx).
 */
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeApi, renderRoutes } from '@/test/auth-helpers'
import { exercisePage, fixedLists, testExercise } from '@/test/exercise-helpers'
import { ExercisesPage } from './ExercisesPage'

/** The list, and plain stand-ins for the pages its links open. */
const routes = [
  { path: 'exercises', element: <ExercisesPage /> },
  { path: 'exercises/new', element: <p>the editor</p> },
  { path: 'exercises/:id', element: <p>an exercise</p> },
]

/**
 * The values of one filter in every list request sent so far, in order.
 * @param name the parameter, such as 'filter[search]'
 */
function sentFilter(fake: ReturnType<typeof fakeApi>, name: string): (string | null)[] {
  return fake.mock.calls
    .map(([path]) => String(path))
    .filter(path => path.startsWith('/api/exercises?'))
    // new URL() needs a full address to read a path's query string
    .map(path => new URL(path, 'http://localhost').searchParams.get(name))
}

describe('ExercisesPage', () => {
  it('lists the exercises with their count, cover, main muscle and Mine badge', async () => {
    fakeApi({
      ...fixedLists,
      'GET /api/exercises': exercisePage([
        testExercise(),
        testExercise({ id: 13, name: 'Panca mia', is_mine: true, photos: [], muscles: [] }),
      ]),
    })
    renderRoutes(routes, '/exercises')

    // The whole row is a link, named by its text
    const publicRow = await screen.findByRole('link', { name: /Barbell Bench Press/ })
    expect(publicRow).toHaveAttribute('href', '/exercises/12')
    expect(within(publicRow).getByText('Chest')).toBeInTheDocument()
    // The cover, from its small copy (thumb_url)
    expect(publicRow.querySelector('img')).toHaveAttribute('src', '/storage/1/conversions/0-thumb.webp')
    expect(within(publicRow).queryByText('Mine')).not.toBeInTheDocument()

    const mineRow = screen.getByRole('link', { name: /Panca mia/ })
    expect(within(mineRow).getByText('Mine')).toBeInTheDocument()
    expect(screen.getByText('2 exercises')).toBeInTheDocument()
  })

  it('searches once typing pauses, and keeps the search in the address', async () => {
    const fake = fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([testExercise()]) })
    const { router } = renderRoutes(routes, '/exercises')

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search exercises' }), 'panca')

    // One request with the whole word, none for "p", "pa"…; null is the first
    // request, with no search
    await waitFor(() => expect(sentFilter(fake, 'filter[search]')).toEqual([null, 'panca']))
    expect(router.state.location.search).toBe('?q=panca')
  })

  it('shows a spinner in the search box until the searched list is on screen', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([testExercise()]) })
    renderRoutes(routes, '/exercises')
    await screen.findByRole('link', { name: /Barbell Bench Press/ })
    // No search running: no spinner
    expect(screen.queryByRole('status', { name: 'Searching…' })).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search exercises' }), 'panca')

    // Right after typing: the search waits for the pause, and says so
    expect(screen.getByRole('status', { name: 'Searching…' })).toBeInTheDocument()
    // Once the answer is in, the spinner goes
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Searching…' })).not.toBeInTheDocument())
  })

  it('reads the filters from the address and sends them', async () => {
    const fake = fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([testExercise()]) })
    renderRoutes(routes, '/exercises?muscle=chest&source=mine')

    await screen.findByRole('link', { name: /Barbell Bench Press/ })

    expect(sentFilter(fake, 'filter[muscle]')).toEqual(['chest'])
    expect(sentFilter(fake, 'filter[source]')).toEqual(['mine'])
    // The controls show them: the pressed button, the number on Filters,
    // and, in the panel it opens, the select's value
    expect(screen.getByRole('button', { name: 'Mine' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Filters, 1 active' }))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Muscle group' })).toHaveValue('chest'))
  })

  it('changes a filter in the address and in the request', async () => {
    const fake = fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([testExercise()]) })
    const { router } = renderRoutes(routes, '/exercises')

    // Muscle and equipment are in the Filters panel, from the bottom
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    // The panel: a dialog named by its title
    const panel = screen.getByRole('dialog', { name: 'Filters' })
    // The option exists once GET /api/equipment has answered
    await within(panel).findByRole('option', { name: 'Barbell' })
    await userEvent.selectOptions(within(panel).getByRole('combobox', { name: 'Equipment' }), 'barbell')
    // Show closes the panel; the button now says one filter is on
    await userEvent.click(within(panel).getByRole('button', { name: 'Show exercises' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Public' }))

    expect(router.state.location.search).toBe('?equipment=barbell&source=public')
    await waitFor(() => expect(sentFilter(fake, 'filter[source]')).toContain('public'))
    expect(sentFilter(fake, 'filter[equipment]')).toContain('barbell')
  })

  it('offers to create the exercise a search did not find', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([]) })
    renderRoutes(routes, '/exercises?q=panca%20mia')

    expect(await screen.findByRole('heading', { name: 'No exercise for «panca mia»' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create «panca mia»' })).toHaveAttribute('href', '/exercises/new?name=panca%20mia')
  })

  it('invites to create the first personal exercise', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([]) })
    renderRoutes(routes, '/exercises?source=mine')

    expect(await screen.findByRole('heading', { name: 'No personal exercises yet' })).toBeInTheDocument()
  })

  it('offers to clear filters that match nothing', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises': exercisePage([]) })
    const { router } = renderRoutes(routes, '/exercises?muscle=chest&equipment=barbell')

    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }))

    expect(router.state.location.search).toBe('')
  })

  it('loads the next page with Show more', async () => {
    fakeApi({
      ...fixedLists,
      // An exact key per page: the query string decides which answer comes back
      'GET /api/exercises?page=1&per_page=50': exercisePage([testExercise()], { last_page: 2, total: 2 }),
      'GET /api/exercises?page=2&per_page=50': exercisePage([testExercise({ id: 14, name: 'Squat' })], { current_page: 2, last_page: 2, total: 2 }),
    })
    renderRoutes(routes, '/exercises')

    await userEvent.click(await screen.findByRole('button', { name: 'Show more' }))

    expect(await screen.findByRole('link', { name: /Squat/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Barbell Bench Press/ })).toBeInTheDocument()
    // The last page: no more button
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
  })

  it('says so when the list cannot be loaded', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises': { status: 500 } })
    renderRoutes(routes, '/exercises')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The exercises could not be loaded.')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
