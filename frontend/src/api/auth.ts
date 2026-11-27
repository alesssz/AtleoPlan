/*
 * The account: who is signed in, signing in, up and out, confirming the
 * address, password reset and preferences. /api/auth/* are Fortify's routes, /api/user the app's.
 *
 * "Who is signed in" is one piece of server data, authKeys.user: the User, or
 * null for a visitor. The guards (src/routes/) read it; signing in and out
 * change it, and the screens follow.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient, type UseQueryResult } from '@tanstack/react-query'
import type { Language } from '@/i18n/languages'
import { ApiError, ensureCsrfCookie, request } from '@/lib/http'
import { addPendingPreferences, loadPendingPreferences, sendPendingPreferences } from '@/lib/pending-preferences'
import type { Theme } from '@/theme/theme'

/** As sent by the backend's UserResource. */
export interface User {
  id: number
  name: string
  email: string
  /**
   * False until the link of the confirmation email is opened: the server
   * refuses the rest of the API, and RequireAuth shows only VerifyEmailPage.
   */
  email_verified: boolean
  is_admin: boolean
  /**
   * The admin panel's address, for Profile's link; null for non-admins. The
   * backend knows where the panel is.
   */
  admin_url: string | null
  locale: Language
  theme: Theme
  /** Display only: weights are stored in kilograms. */
  weight_unit: 'kg' | 'lb'
  /** For plan items that set no rest. */
  default_rest_seconds: number
  /** Exact decimal text, "2.50". */
  weight_step: string
  timer_sound: boolean
  timer_vibration: boolean
  /** Seconds to get ready after ▶ on a timed set; 0 starts the stopwatch at once. */
  countdown_seconds: number
  /** Whether the plan editor shows the RPE field. */
  show_rpe: boolean
}

export interface SignInData {
  email: string
  password: string
}

export interface SignUpData extends SignInData {
  name: string
  password_confirmation: string
  /** The browser's language, saved on the new account. */
  locale: Language
}

export interface ResetPasswordData {
  /** From the email's link, like the email. */
  token: string
  email: string
  password: string
  password_confirmation: string
}

/**
 * Only the fields that change. Named and typed as on User, so the optimistic
 * update can copy them into the cached user as they are.
 */
export interface PreferencesData {
  locale?: Language
  theme?: Theme
  weight_unit?: User['weight_unit']
  /** 0: no rest timer. */
  default_rest_seconds?: number
  /** Two decimals as text: "1.25". */
  weight_step?: string
  timer_sound?: boolean
  timer_vibration?: boolean
  /** 0 to 30; 0: no countdown. */
  countdown_seconds?: number
  show_rpe?: boolean
}

export const authKeys = {
  user: ['user'] as const,
}

const UPDATE_PREFERENCES_KEY = ['updatePreferences']

/**
 * A 401 is the answer "nobody" and becomes null, which the guards expect. Any
 * other error stays one: no network must not look like being signed out.
 *
 * The preferences changed on this phone and not sent yet go over the server's
 * values (pending-preferences.ts). By the user's own id: the first read after
 * opening comes before RequireAuth knows who owns the phone.
 * @throws ApiError on anything but a 401
 */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
  try {
    const answer = await request<{ data: User }>('/api/user', { signal })
    return { ...answer.data, ...loadPendingPreferences(answer.data.id) }
  }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/** After signing in or up; the guards see the new user and move on. */
async function refreshCurrentUser(queryClient: QueryClient): Promise<void> {
  await queryClient.fetchQuery({ queryKey: authKeys.user, queryFn: () => fetchCurrentUser(), staleTime: 0 })
}

/** `data`: the User, null for a visitor, undefined while loading. */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
  })
}

/**
 * Whether the guards must still wait for the answer. Offline, TanStack Query
 * pauses the request instead of failing it, so the query stays pending until
 * the network returns: waiting for that would keep a skeleton on screen for good.
 */
export function isAwaitingUser(currentUser: UseQueryResult<User | null>): boolean {
  return currentUser.isPending && currentUser.fetchStatus !== 'paused'
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SignInData) => {
      // The page may have been open for a long time
      await ensureCsrfCookie()
      // Always remembered: a phone at the gym must not be signed out after
      // two hours, and the screen has no checkbox to tap
      await request<void>('/api/auth/login', { method: 'POST', body: { ...data, remember: true } })
    },
    onSuccess: () => refreshCurrentUser(queryClient),
  })
}

/** Fortify signs the new user in. */
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

/** The service worker's cache of exercise photos (vite.config.ts). */
const PHOTO_CACHE = 'photos'

/**
 * Nobody is signed in any more: the user becomes null, which sends the guards
 * to /login, and the account's data goes (forgetAccountData()).
 */
export function forgetAccount(queryClient: QueryClient): void {
  queryClient.setQueryData(authKeys.user, null)
  forgetAccountData(queryClient)
}

/**
 * Removes what was kept for the account, so the next user on this device sees
 * none of it: the cached answers, in memory and in the copy kept on the phone,
 * and the photos, the user's own among them. The workouts and drafts in
 * localStorage stay, under their owner's keys (deviceOwner()).
 */
export function forgetAccountData(queryClient: QueryClient): void {
  queryClient.removeQueries({ predicate: query => query.queryKey[0] !== authKeys.user[0] })
  // No Cache API without a secure origin, nor in tests
  if ('caches' in window) void caches.delete(PHOTO_CACHE).catch(() => undefined)
}

/** The cache is emptied even after an error: the user wanted out. */
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => forgetAccount(queryClient),
  })
}

/**
 * "Send the link again". The server sends nothing for an address already
 * confirmed, and answers the same.
 */
export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: () => request<void>('/api/user/verification-email', { method: 'POST' }),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => request<void>('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  })
}

/** Does not sign in: the user does that next, with the new password. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => request<void>('/api/auth/reset-password', { method: 'POST', body: data }),
  })
}

/**
 * Optimistic: the change goes into the cache at once and useAccountPreferences
 * applies it. It is kept on the phone before it is sent, with any change still
 * waiting (pending-preferences.ts): with no network or no server it waits for
 * the queue's next round, and survives a reload meanwhile. It never fails.
 *
 * The server's answers are never written into the cache: with two changes close
 * together, the second answer can carry the old value of the first. The user is
 * read again once the last change has finished.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: UPDATE_PREFERENCES_KEY,
    // At once, also offline: the change must reach the phone's storage now,
    // not when the network returns
    networkMode: 'always',
    mutationFn: async (data: PreferencesData) => {
      addPendingPreferences(data)
      await sendPendingPreferences()
    },
    onMutate: async (data) => {
      // A read on its way may hold the old values and land after this change
      await queryClient.cancelQueries({ queryKey: authKeys.user })
      queryClient.setQueryData<User | null>(authKeys.user, current => current && { ...current, ...data })
    },
    // 1: this is the last change still running. Returning the promise keeps
    // the mutation pending until the read has finished
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: UPDATE_PREFERENCES_KEY }) === 1) {
        return queryClient.invalidateQueries({ queryKey: authKeys.user })
      }
    },
  })
}
