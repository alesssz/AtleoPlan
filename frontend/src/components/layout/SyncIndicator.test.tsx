import { onlineManager } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { SessionInput } from '@/api/sessions'
import { addPending, loadPending } from '@/components/workout/session-storage'
import { request } from '@/lib/http'
import { addPendingPreferences, loadPendingPreferences } from '@/lib/pending-preferences'
import { sendPendingSessions } from '@/lib/pending-sessions'
import { fakeApi, renderRoutes, type FakeAnswer } from '@/test/auth-helpers'
import { ConnectionBanner } from './ConnectionBanner'
import { SyncIndicator } from './SyncIndicator'

/** The two as AppLayout shows them. */
function Both() {
  return (
    <>
      <SyncIndicator />
      <ConnectionBanner />
    </>
  )
}

const routes = [{ path: '/', element: <Both /> }]

/** Opens the list of what waits from the pill, and sends it from there. */
async function sendFromTheList(pill: string | RegExp) {
  await userEvent.click(screen.getByRole('button', { name: pill }))
  const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Send now' }))
}

/** A request with no answer, as with the backend stopped. */
async function serverStops() {
  fakeApi({ 'GET /api/home': 'network' })
  await request('/api/home').catch(() => {})
}

const body: SessionInput = {
  plan_id: null, plan_day_id: null, plan_name: 'Push Pull Legs', day_name: 'Day A – Push', started_at: '2026-11-16T18:00:00+01:00',
  finished_at: '2026-11-16T19:00:00+01:00', duration_seconds: 3600, feeling: null, notes: null, exercises: [],
}

const saved: FakeAnswer = { status: 200, body: { data: { id: 'w-1' } } }

// The online state is TanStack Query's, shared by every test
afterEach(() => {
  onlineManager.setOnline(true)
})

describe('SyncIndicator', () => {
  it('shows nothing when everything is on the server', () => {
    renderRoutes(routes, '/')

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText('Offline')).not.toBeInTheDocument()
    expect(screen.queryByText(/workouts stay on this phone/)).not.toBeInTheDocument()
  })

  it('says offline, and that changes stay on the phone', () => {
    onlineManager.setOnline(false)
    renderRoutes(routes, '/')

    expect(screen.getByTitle('Changes are saved on this phone')).toHaveTextContent('Offline')
    expect(screen.getByText(/You are offline: workouts stay on this phone/)).toBeInTheDocument()
  })

  it('says so when the network is there but the server does not answer, and asks it again on a tap', async () => {
    await serverStops()
    renderRoutes(routes, '/')

    expect(screen.getByText(/The server is not answering: workouts stay on this phone/)).toBeInTheDocument()

    // Nothing waits, and the window opens all the same: the place for the
    // outcome of a try
    await userEvent.click(screen.getByRole('button', { name: 'Server offline' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
    expect(within(dialog).getByText('Nothing waiting.')).toBeInTheDocument()

    fakeApi({ 'GET /api/health': { status: 200, body: { status: 'ok' } } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Check again now' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('lists the workouts waiting on a tap, and sends them from the list', async () => {
    addPending('w-1', body)
    fakeApi({ 'PUT /api/sessions/w-1': saved })
    renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: '1 change to send' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
    expect(within(dialog).getByText('Day A – Push')).toBeInTheDocument()
    expect(within(dialog).getByText('Push Pull Legs')).toBeInTheDocument()
    expect(within(dialog).getByText(/Monday, November 16/)).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send now' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(loadPending()).toEqual({})
  })

  it('lists them offline too, with nothing to try until the network returns', async () => {
    addPending('w-1', body)
    onlineManager.setOnline(false)
    renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: 'Offline, 1 change to send' }))

    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
    expect(within(dialog).getByText('Day A – Push')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Send now' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Check again now' })).not.toBeInTheDocument()
  })

  it('counts the preferences changed on this phone as one change, beside the workouts, and sends them too', async () => {
    addPending('w-1', body)
    addPendingPreferences({ theme: 'light', weight_unit: 'lb' })
    const fake = fakeApi({ 'PUT /api/sessions/w-1': saved, 'PATCH /api/user/preferences': { status: 204 } })
    renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: '2 changes to send' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
    expect(within(dialog).getByText('Settings')).toBeInTheDocument()
    expect(within(dialog).getByText('Day A – Push')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send now' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(loadPendingPreferences()).toEqual({})
    expect(fake.mock.calls.some(([path]) => path === '/api/user/preferences')).toBe(true)
  })

  it('lists preferences waiting alone, offline too', async () => {
    addPendingPreferences({ theme: 'light' })
    onlineManager.setOnline(false)
    renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: 'Offline, 1 change to send' }))

    expect(within(await screen.findByRole('dialog', { name: 'Not sent yet' })).getByText('Settings')).toBeInTheDocument()
  })

  it('follows the queue as it changes, from another page or tab', () => {
    renderRoutes(routes, '/')

    act(() => addPending('w-1', body))

    expect(screen.getByRole('button', { name: '1 change to send' })).toBeInTheDocument()
  })

  it('shows what the server refused and why, and tries again', async () => {
    addPending('w-1', body)
    let answer: FakeAnswer = { status: 422, body: { message: 'The given data was invalid.' } }
    fakeApi({ 'PUT /api/sessions/w-1': () => answer })
    renderRoutes(routes, '/')

    await sendFromTheList('1 change to send')
    await userEvent.click(await screen.findByRole('button', { name: 'Not saved' }))

    const dialog = await screen.findByRole('dialog', { name: 'Not saved on the server' })
    expect(within(dialog).getByText('Day A – Push')).toBeInTheDocument()
    expect(within(dialog).getByText('The server found an error in it.')).toBeInTheDocument()

    answer = saved
    await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(loadPending()).toEqual({})
  })

  it('lists what waits behind Server offline, and asks the server again from there', async () => {
    addPending('w-1', body)
    await serverStops()
    renderRoutes(routes, '/')

    await userEvent.click(screen.getByRole('button', { name: 'Server offline, 1 change to send' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })
    expect(within(dialog).getByText('Day A – Push')).toBeInTheDocument()

    fakeApi({ 'GET /api/health': { status: 200, body: { status: 'ok' } } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Check again now' }))

    // The server answers: the same window moves on, the workout now waiting
    // its round, which useServerWatch starts (tested there)
    expect(await within(dialog).findByRole('button', { name: 'Send now' })).toBeInTheDocument()
    expect(within(dialog).queryByText(/Tried at/)).not.toBeInTheDocument()
  })

  it('says a sync started by the app is over, and how many it saved', async () => {
    addPending('w-1', body)
    fakeApi({ 'PUT /api/sessions/w-1': saved })
    renderRoutes(routes, '/')

    await sendFromTheList('1 change to send')

    expect(await screen.findByText('Sync done: 1 workout saved on the server.')).toBeInTheDocument()
  })

  it('stays quiet about a round that is part of Finish or Save, whose page says the outcome', async () => {
    addPending('w-1', body)
    fakeApi({ 'PUT /api/sessions/w-1': saved })
    renderRoutes(routes, '/')

    await act(() => sendPendingSessions())

    expect(screen.queryByText(/Sync done/)).not.toBeInTheDocument()
  })

  it('says when a try by hand found the server still away, with its time', async () => {
    addPending('w-1', body)
    await serverStops()
    renderRoutes(routes, '/')
    await userEvent.click(screen.getByRole('button', { name: 'Server offline, 1 change to send' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })

    fakeApi({ 'GET /api/health': { status: 502 } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Check again now' }))

    expect(await within(dialog).findByText(/^Tried at .+: the server is still not answering\. The app tries again by itself every 10 seconds\.$/)).toBeInTheDocument()
  })

  it('keeps the window open when sending finds the server gone, and says so', async () => {
    addPending('w-1', body)
    fakeApi({ 'PUT /api/sessions/w-1': { status: 502 } })
    renderRoutes(routes, '/')
    await userEvent.click(screen.getByRole('button', { name: '1 change to send' }))
    const dialog = await screen.findByRole('dialog', { name: 'Not sent yet' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send now' }))

    expect(await within(dialog).findByText(/the server is still not answering/)).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Not sent yet' })).toBe(dialog)
    expect(within(dialog).getByRole('button', { name: 'Check again now' })).toBeInTheDocument()
  })
})
