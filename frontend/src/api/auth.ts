/*
 * The account: who is signed in, signing in, up and out, resetting a password
 * and saving the preferences. Like every file in src/api/, it holds the types,
 * the cache keys, the functions that call the API and the hooks components use
 * (the pattern: docs/concepts/C1-frontend.md C1.6; src/api/health.ts is the simplest case).
 *
 * The backend's routes: /api/auth/* are Fortify's (backend config/fortify.php),
 * /api/user is ours (backend routes/api.php). How signing in works:
 * docs/concepts/C2-backend.md C2.7; how this side fits together: docs/concepts/C1-frontend.md C1.13.
 *
 * The one fact everything here turns on: "who is signed in" is one piece of
 * server data, in the cache under authKeys.user. It holds the user, or null
 * for a visitor. The guards (src/routes/) read it; signing in and out change it,
 * and the screens follow by themselves.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Language } from '@/i18n/languages'
import { ApiError, ensureCsrfCookie, request } from '@/lib/http'
import type { Theme } from '@/theme/theme'

/** The signed-in user, as sent by the backend's UserResource. */
export interface User {
  /** The account's number. */
  id: number
  /** The name shown in Profile. */
  name: string
  /** The address used to sign in. */
  email: string
  /** Whether the account opens the admin panel at /admin. */
  is_admin: boolean
  /** The interface's language, saved on the account. */
  locale: Language
  /** The theme, saved on the account. */
  theme: Theme
  /** Which unit weights are shown in. */
  weight_unit: 'kg' | 'lb'
  /** The rest between sets when a plan item sets none, in seconds. */
  default_rest_seconds: number
  /** The stepper's step in workout mode. A string, because the backend keeps decimals exact. */
  weight_step: string
  /** Whether the rest timer ends with a sound. */
  timer_sound: boolean
  /** Whether the rest timer ends with a vibration. */
  timer_vibration: boolean
}

/** What signing in sends. */
export interface SignInData {
  /** The account's address. */
  email: string
  /** The password. */
  password: string
}

/** What signing up sends. */
export interface SignUpData extends SignInData {
  /** The name shown in Profile. */
  name: string
  /** The password again; the backend checks that the two match. */
  password_confirmation: string
  /** The browser's language, saved on the new account. */
  locale: Language
}

/** What setting a new password sends. */
export interface ResetPasswordData {
  /** The secret from the email's link. */
  token: string
  /** The account's address, also from the link. */
  email: string
  /** The new password. */
  password: string
  /** The new password again. */
  password_confirmation: string
}

/**
 * The preferences that can be saved (PATCH /api/user/preferences); send only
 * those that change. The names and types are the User's, so the optimistic
 * update below can copy them into the cached user as they are.
 */
export interface PreferencesData {
  /** The interface's language. */
  locale?: Language
  /** The theme. */
  theme?: Theme
  /** The unit weights are shown and typed in; they stay in kilograms. */
  weight_unit?: User['weight_unit']
  /** The rest when a plan item sets none, in seconds; 0 for no timer. */
  default_rest_seconds?: number
  /** The stepper's weight step, as text with two decimals: "1.25". */
  weight_step?: string
  /** Whether the rest timer ends with a sound. */
  timer_sound?: boolean
  /** Whether the rest timer ends with a vibration. */
  timer_vibration?: boolean
}

/** The cache keys of this resource (what a key is: src/api/health.ts). */
export const authKeys = {
  /** Who is signed in: the User, or null for a visitor. */
  user: ['user'] as const,
}

/** The name of the requests that save preferences (see useUpdatePreferences). */
const UPDATE_PREFERENCES_KEY = ['updatePreferences']

/**
 * Asks who is signed in. A 401 is not a failure here but the answer "nobody":
 * it becomes null, which is what the guards expect. Any other error stays an
 * error: no network must not be mistaken for being signed out.
 * @param signal optional cancel signal
 * @returns a Promise of the user, or of null for a visitor
 * @throws ApiError on anything but a 401
 */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
  try {
    // Laravel's API Resources wrap their answer in a `data` key
    const answer = await request<{ data: User }>('/api/user', { signal })
    return answer.data
  }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/**
 * Asks the backend who is signed in, and updates the cache. Called right after
 * signing in or up; the guards see the new user and move on by themselves.
 * @param queryClient the cache
 */
async function refreshCurrentUser(queryClient: QueryClient): Promise<void> {
  // fetchQuery ignores how fresh the cached answer is, unlike a plain useQuery
  await queryClient.fetchQuery({ queryKey: authKeys.user, queryFn: () => fetchCurrentUser(), staleTime: 0 })
}

/**
 * Hook: who is signed in. Every component using it shares one request and one
 * answer. `data` is the User, or null for a visitor; undefined while loading.
 * @example const { data: user } = useCurrentUser()
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
  })
}

/**
 * Hook: signs in. useMutation is TanStack Query's tool for requests that change
 * something: nothing runs until `mutate(data)` is called, and it reports
 * `isPending`, `isError` and so on.
 * @example const signIn = useSignIn(); signIn.mutate({ email, password })
 */
export function useSignIn() {
  // The app's cache, from the provider in src/App.tsx
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SignInData) => {
      // A fresh token: the page may have been open for a long time
      await ensureCsrfCookie()
      // `remember`: a long-lived cookie, or a phone at the gym would be signed
      // out after two hours. Always on, so the screen has no checkbox to tap.
      // void: the answer has nothing we need
      await request<void>('/api/auth/login', { method: 'POST', body: { ...data, remember: true } })
    },
    onSuccess: () => refreshCurrentUser(queryClient),
  })
}

/**
 * Hook: signs up. Fortify creates the account and signs the new user in.
 * @example const signUp = useSignUp(); signUp.mutate(data)
 */
export function useSignUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SignUpData) => {
      await ensureCsrfCookie()
      await request<void>('/api/auth/register', { method: 'POST', body: data })
    },
    onSuccess: () => refreshCurrentUser(queryClient),
  })
}

/**
 * Hook: signs out. Whatever the backend answers, the user wanted out, so the
 * cache is emptied even after an error: `onSettled` runs in both cases.
 * Everything but "who is signed in" is removed, because the next user on this
 * device must not see this one's data; that one is set to null, which is what
 * sends the guards to /login.
 * @example const signOut = useSignOut(); signOut.mutate()
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.setQueryData(authKeys.user, null)
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== authKeys.user[0] })
    },
  })
}

/**
 * Hook: asks for the "reset your password" email.
 * @example const forgot = useForgotPassword(); forgot.mutate('ann@example.com')
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => request<void>('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  })
}

/**
 * Hook: sets the new password, with the token from the email. It does not sign
 * in: the user does that next, with the new password.
 * @example const reset = useResetPassword(); reset.mutate(data)
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => request<void>('/api/auth/reset-password', { method: 'POST', body: data }),
  })
}

/**
 * Hook: saves the language or the theme on the account.
 *
 * The change is written into the cache at once ("optimistic update",
 * docs/design/D1-ui.md D1.6), and useAccountPreferences (src/routes/) applies it
 * to the page, so the screen never waits for the network. A failed save is
 * not undone: the choice stays until the page reloads, then the account's value
 * returns. The offline queue will save it later (FEAT-3).
 *
 * The server's answers are deliberately not written into the cache. With two
 * changes close together, the answer to the second can be computed before the
 * first is saved, and so carry the old value of the first: writing it would undo
 * what the user just chose. Instead the cache is read again once the last change
 * has finished. Why this matters: docs/concepts/C1-frontend.md C1.13.
 *
 * @example const update = useUpdatePreferences(); update.mutate({ theme: 'light' })
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    // A name for these requests, so they can be counted below
    mutationKey: UPDATE_PREFERENCES_KEY,
    mutationFn: (data: PreferencesData) => request<void>('/api/user/preferences', { method: 'PATCH', body: data }),
    onMutate: async (data) => {
      // A read already on its way may hold the old values: it must not land
      // after this change, so it is cancelled
      await queryClient.cancelQueries({ queryKey: authKeys.user })
      // The function form receives what is in the cache. `current && …` leaves
      // null as it is. `{ ...current, ...data }`: a copy with these fields replaced
      queryClient.setQueryData<User | null>(authKeys.user, current => current && { ...current, ...data })
    },
    // Runs after success and failure alike. isMutating() counts the requests still
    // running, this one included, so 1 means this is the last of them: only now
    // can the server's answer be trusted. Returning the Promise keeps the request
    // "pending" until the read has finished
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: UPDATE_PREFERENCES_KEY }) === 1) {
        return queryClient.invalidateQueries({ queryKey: authKeys.user })
      }
    },
  })
}
