/*
 * One phone, two accounts, with the real guards, sign-in form, Home and
 * Profile: what one user leaves on the phone neither shows to the next nor
 * reaches their account, and waits for its owner.
 */
import { onlineManager } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/api/auth'
import type { HomeData } from '@/api/home'
import type { SessionInput } from '@/api/sessions'
import { addPending, storeActiveSession } from '@/components/workout/session-storage'
import { startFreeSession } from '@/components/workout/workout-session'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { fakeApi, renderRoutes, signedInAs, testUser, visitor } from '@/test/auth-helpers'
import { RequireAuth } from './RequireAuth'
import { RequireGuest } from './RequireGuest'

const routes = [
  { element: <RequireGuest />, children: [{ path: 'login', element: <LoginPage /> }] },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]

const ann = testUser
const bea: User = { ...testUser, id: 2, name: 'Bea', email: 'bea@example.com' }

/** A body to queue; its content does not matter here. */
const body = { exercises: [] } as unknown as SessionInput

const emptyHome: HomeData = { active_plan: null, days: [], suggested_day_id: null, last_day: null, open_session: null, recent_sessions: [] }

// The online state is TanStack Query's, shared by every test
afterEach(() => {
  onlineManager.setOnline(true)
})

describe('a phone shared by two accounts', () => {
  it('keeps what Ann left for Ann: Bea neither sees nor sends it, and Ann finds it again', async () => {
    // Ann's workout in progress, and one finished that the server could not take yet
    storeActiveSession(startFreeSession(new Date()))
    addPending('ann-1', body)
    let who: User | null = ann
    // Who the sign-in form signs in, set before each sign-in
    let signingIn: User = bea
    let serverUp = false
    const savedBy: number[] = []
    const photoCache = vi.fn(async () => true)
    vi.stubGlobal('caches', { delete: photoCache })
    fakeApi({
      'GET /api/user': () => (who ? signedInAs(who) : visitor),
      'GET /api/home': { status: 200, body: { data: emptyHome } },
      'GET /api/health': { status: 200, body: { status: 'ok' } },
      'POST /api/auth/login': () => {
        who = signingIn
        return { status: 204 }
      },
      'POST /api/auth/logout': () => {
        who = null
        return { status: 204 }
      },
      'PUT /api/sessions/ann-1': () => {
        if (!serverUp) return { status: 503 }
        savedBy.push(who?.id ?? 0)
        return { status: 201, body: { data: { id: 'ann-1' } } }
      },
    })
    const { router } = renderRoutes(routes, '/profile')
    const user = userEvent.setup()

    async function signIn(as: User) {
      signingIn = as
      await user.type(await screen.findByLabelText('Email'), as.email)
      await user.type(screen.getByLabelText('Password'), 'secret-password')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(await screen.findByText(as.name)).toBeInTheDocument()
    }

    // Ann is told what stays on the phone, and can change her mind
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    const question = await screen.findByRole('alertdialog')
    expect(question).toHaveTextContent('A workout has not reached the server yet. It stays on this phone, and is sent when you sign in here again.')
    expect(question).toHaveTextContent('The workout in progress stays on this phone')
    await user.click(within(question).getByRole('button', { name: 'Stay signed in' }))
    expect(screen.getByText('Ann')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(photoCache).toHaveBeenCalledWith('photos')

    // Bea, with the server back: nothing of Ann's shows, nor is sent
    serverUp = true
    await signIn(bea)
    await act(() => router.navigate('/'))
    expect(await screen.findByRole('button', { name: 'Start a free workout' })).toBeEnabled()
    expect(screen.queryByText(/Workout in progress/)).not.toBeInTheDocument()
    expect(savedBy).toEqual([])

    // Nothing of Bea's waits: she signs out without a question
    await act(() => router.navigate('/profile'))
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()

    // Ann again: her workout reaches her account, and the one in progress is back
    await signIn(ann)
    await waitFor(() => expect(savedBy).toEqual([ann.id]))
    await act(() => router.navigate('/'))
    expect(await screen.findByText('Workout in progress: Free workout')).toBeInTheDocument()
  })

  it('drops what was kept for a user whose session ended elsewhere', async () => {
    let who: User | null = ann
    fakeApi({
      'GET /api/user': () => (who ? signedInAs(who) : visitor),
      'GET /api/home': { status: 200, body: { data: emptyHome } },
    })
    const { queryClient } = renderRoutes(routes, '/')
    expect(await screen.findByRole('button', { name: 'Start a free workout' })).toBeInTheDocument()
    expect(queryClient.getQueryData(['home'])).toBeDefined()

    // Signed out on another device: the next read of the user finds nobody
    who = null
    await act(() => queryClient.invalidateQueries({ queryKey: ['user'] }))

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(queryClient.getQueryData(['home'])).toBeUndefined()
  })
})
