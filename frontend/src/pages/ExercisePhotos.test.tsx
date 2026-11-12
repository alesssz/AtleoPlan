/*
 * The photos of a personal exercise on its edit page (ExercisePhotoManager,
 * docs/design/D1-ui.md D1.4.5, docs/concepts/C1-frontend.md C1.14.7), and
 * Duplicate as mine on a public exercise's page (D1.4.4).
 *
 * Fixtures: fakeApi for the JSON requests, fakeUploads for the uploads,
 * which go through XMLHttpRequest; a fake server that remembers the photos,
 * so the exercise read again after a change shows them, as the real one does.
 */
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ExercisePhoto } from '@/api/exercises'
import { fakeApi, renderRoutes } from '@/test/auth-helpers'
import { fakeUploads, fixedLists, testExercise } from '@/test/exercise-helpers'
import { ExerciseDetailPage } from './ExerciseDetailPage'
import { ExerciseEditorPage } from './ExerciseEditorPage'

/** The pages tested, and a stand-in for the list. */
const routes = [
  { path: 'exercises', element: <p>the list</p> },
  { path: 'exercises/:id', element: <ExerciseDetailPage /> },
  { path: 'exercises/:id/edit', element: <ExerciseEditorPage /> },
]

/**
 * A photo as the API sends it.
 * @param id its number
 */
function photo(id: number): ExercisePhoto {
  return { id, url: `/storage/${id}/conversions/photo-large.webp`, thumb_url: `/storage/${id}/conversions/photo-thumb.webp` }
}

/**
 * A fake server for Ann's exercise 7, whose photos change with the requests.
 * @param start the photos it has at first
 * @returns the photos now, and the fake fetch
 */
function exerciseServer(start: ExercisePhoto[]) {
  // The server's state: the photos, in order
  const state = { photos: [...start] }
  // The fake fetch, whose answers read the state
  const fake = fakeApi({
    ...fixedLists,
    'GET /api/exercises/7': () => ({ status: 200, body: { data: testExercise({ id: 7, is_mine: true, photos: state.photos }) } }),
    'PUT /api/exercises/7/photos': () => ({ status: 200, body: { data: state.photos } }),
  })
  return { state, fake }
}

describe('the photos of my exercise', () => {
  it('uploads a photo with its bar, then shows it as the cover', async () => {
    // Ann's exercise, with no photos yet
    const { state } = exerciseServer([])
    // Each upload adds photo 21 to the server, and answers with it
    const sent = fakeUploads(() => {
      state.photos.push(photo(21))
      return { status: 201, body: { data: photo(21) } }
    })
    renderRoutes(routes, '/exercises/7/edit')
    // A user that types and clicks, and picks files
    const user = userEvent.setup()

    // The file input, found by its label, the drop zone's text
    const input = await screen.findByLabelText(/Add photos/)
    await user.upload(input, new File(['jpeg bytes'], 'IMG_1.jpg', { type: 'image/jpeg' }))

    // The new photo, the first one: the cover
    expect(await screen.findByText('Cover')).toBeInTheDocument()
    expect(sent).toHaveLength(1)
    expect(sent[0]?.path).toBe('/api/exercises/7/photos')
    expect((sent[0]?.form.get('photo') as File).name).toBe('IMG_1.jpg')
  })

  it('refuses a HEIC photo and one over 10 MB before sending them', async () => {
    exerciseServer([])
    // Uploads that would be accepted, recorded in `sent`
    const sent = fakeUploads({ status: 201, body: { data: photo(21) } })
    renderRoutes(routes, '/exercises/7/edit')
    // applyAccept: false lets the test pick a file the input's `accept` would hide
    const user = userEvent.setup({ applyAccept: false })

    // The file input, found by its label
    const input = await screen.findByLabelText(/Add photos/)
    await user.upload(input, new File(['x'], 'IMG_2.heic', { type: 'image/heic' }))
    expect(await screen.findByText('«IMG_2.heic» is not a JPEG, PNG or WebP photo.')).toBeInTheDocument()

    // A file whose size says 11 MB, without 11 MB of content
    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    await user.upload(input, big)
    expect(await screen.findByText('«big.jpg» is over 10 MB.')).toBeInTheDocument()

    expect(sent).toHaveLength(0)
  })

  it('shows the server\'s reason when an upload fails, and tries again', async () => {
    // Ann's exercise, with no photos yet
    const { state } = exerciseServer([])
    // The first upload is refused, the second accepted
    let calls = 0
    fakeUploads(() => {
      calls += 1
      if (calls === 1) return { status: 422, body: { message: 'Invalid', errors: { photo: ['The photo field must be an image.'] } } }
      state.photos.push(photo(22))
      return { status: 201, body: { data: photo(22) } }
    })
    renderRoutes(routes, '/exercises/7/edit')
    // A user that clicks and picks files, as a person would
    const user = userEvent.setup()

    await user.upload(await screen.findByLabelText(/Add photos/), new File(['x'], 'odd.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByText('The photo field must be an image.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try odd.jpg again' }))
    expect(await screen.findByText('Cover')).toBeInTheDocument()
    expect(screen.queryByText('The photo field must be an image.')).not.toBeInTheDocument()
  })

  it('moves a photo earlier, sending the new order', async () => {
    // Ann's exercise with two photos
    const { fake } = exerciseServer([photo(11), photo(12)])
    renderRoutes(routes, '/exercises/7/edit')
    // A user that clicks and picks files, as a person would
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Move photo 2 earlier' }))

    // The PUT's body: photo 12 first
    await waitFor(() => {
      // The PUT sent to the photos' address
      const call = fake.mock.calls.find(([path, init]) => path === '/api/exercises/7/photos' && init?.method === 'PUT')
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({ ids: [12, 11] })
    })
    // The first photo cannot move earlier, the last cannot move later
    expect(screen.getByRole('button', { name: 'Move photo 1 earlier' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move photo 2 later' })).toBeDisabled()
  })

  it('removes a photo after asking', async () => {
    // Ann's exercise with one photo
    const { state, fake } = exerciseServer([photo(11)])
    renderRoutes(routes, '/exercises/7/edit')
    // A user that clicks and picks files, as a person would
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Remove photo 1' }))
    // The dialog asks first
    const dialog = await screen.findByRole('alertdialog')
    // The server forgets the photo, as the DELETE does (answered 204 by
    // fakeApi, which has no entry for it)
    state.photos = []
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(fake.mock.calls.some(([path, init]) => path === '/api/exercises/7/photos/11' && init?.method === 'DELETE')).toBe(true))
    await waitFor(() => expect(screen.queryByText('Cover')).not.toBeInTheDocument())
  })

  it('hides Add photos once there are five', async () => {
    exerciseServer([photo(1), photo(2), photo(3), photo(4), photo(5)])
    renderRoutes(routes, '/exercises/7/edit')

    expect(await screen.findByText('Photo 5')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Add photos/)).not.toBeInTheDocument()
  })
})

describe('Duplicate as mine', () => {
  it('copies a public exercise and opens the copy\'s editor', async () => {
    // A public exercise 12, its copy 99, and the copy's page
    const fake = fakeApi({
      ...fixedLists,
      'GET /api/exercises/12': { status: 200, body: { data: testExercise({ id: 12, is_mine: false }) } },
      'POST /api/exercises/12/duplicate': { status: 201, body: { data: testExercise({ id: 99, is_mine: true }) } },
      'GET /api/exercises/99': { status: 200, body: { data: testExercise({ id: 99, is_mine: true }) } },
    })
    // The router, to read the address the app ends on
    const { router } = renderRoutes(routes, '/exercises/12')
    // A user that clicks and picks files, as a person would
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Duplicate as mine' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/exercises/99/edit'))
    expect(fake.mock.calls.some(([path, init]) => path === '/api/exercises/12/duplicate' && init?.method === 'POST')).toBe(true)
  })

  it('is not offered on my own exercise', async () => {
    fakeApi({ ...fixedLists, 'GET /api/exercises/7': { status: 200, body: { data: testExercise({ id: 7, is_mine: true }) } } })
    renderRoutes(routes, '/exercises/7')

    expect(await screen.findByRole('link', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duplicate as mine' })).not.toBeInTheDocument()
  })
})
