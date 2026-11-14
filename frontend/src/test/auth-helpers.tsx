/*
 * Shared by the tests of signed-in screens: a fake API answering from a table,
 * and a page drawn with the app's providers. Tests never call a real server.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { vi } from 'vitest'
import type { User } from '@/api/auth'
import { ThemeProvider } from '@/theme/ThemeProvider'

/** A signed-in user for tests; `{ ...testUser, locale: 'it' }` changes a field. */
export const testUser: User = {
  id: 1,
  name: 'Ann',
  email: 'ann@example.com',
  is_admin: false,
  admin_url: null,
  locale: 'en',
  theme: 'dark',
  weight_unit: 'kg',
  default_rest_seconds: 90,
  weight_step: '2.50',
  timer_sound: true,
  timer_vibration: true,
  show_rpe: false,
}

export interface FakeAnswer {
  status: number
  /** null sends none. */
  body?: unknown
}

/**
 * Replaces fetch() with a table of answers.
 *
 * The keys are 'METHOD /path', such as 'POST /api/auth/login'. A request with a
 * query string ('GET /api/exercises?page=2') uses its own key when the table has
 * one, otherwise the key of its path alone ('GET /api/exercises'). A path not in
 * the table answers 204, so a test only lists what it is about. A value can also be
 * a function, for an answer that changes between calls, or 'network' to fail as
 * when there is no connection.
 *
 * @returns the fake fetch, whose `mock.calls` tell what was sent
 */
export function fakeApi(answers: Record<string, FakeAnswer | 'network' | (() => FakeAnswer)>) {
  const fake = vi.fn(async (path: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${path}`
    // The exact key, else the path's without the query string
    const entry = answers[key] ?? answers[key.split('?')[0] ?? key]
    const answer = typeof entry === 'function' ? entry() : entry
    if (answer === 'network') throw new TypeError('Failed to fetch')
    const { status, body = null } = answer ?? { status: 204 }
    // A 204 cannot have a body at all
    return new Response(status === 204 ? null : JSON.stringify(body), { status })
  })
  vi.stubGlobal('fetch', fake)
  return fake
}

/**
 * The answer of GET /api/user for a signed-in user, as the backend wraps it.
 * @param user the user; testUser when not given
 */
export function signedInAs(user: User = testUser): FakeAnswer {
  return { status: 200, body: { data: user } }
}

/** The answer of GET /api/user for a visitor. */
export const visitor: FakeAnswer = { status: 401, body: { message: 'Unauthenticated.' } }

/**
 * Draws some routes as the app would: a fresh cache for each test, so nothing
 * leaks between tests, with retries off so failures show at once; the theme; and
 * a router kept in memory rather than in the address bar.
 *
 * @param routes the routes to draw, as in src/router.tsx
 * @returns Testing Library's result, and the router, to read the current address
 */
export function renderRoutes(routes: RouteObject[], initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  }
}

/**
 * What a call to the fake API sent as its JSON body.
 *
 * Only calls that sent a body count: a page that first reads an exercise
 * (GET, no body) and then saves it (PATCH) gives the PATCH's body.
 *
 * @param path the path to look for, such as '/api/auth/login'
 * @returns the decoded body of the first call to that path with a body
 */
export function sentBody(fake: ReturnType<typeof fakeApi>, path: string): unknown {
  const call = fake.mock.calls.find(([calledPath, init]) => calledPath === path && init?.body !== undefined)
  return JSON.parse(String(call?.[1]?.body))
}
