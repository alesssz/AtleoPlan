/*
 * The account: who is signed in, signing in, up and out, password reset and
 * preferences. /api/auth/* are Fortify's routes, /api/user the app's.
 *
 * "Who is signed in" is one piece of server data, authKeys.user: the User, or
 * null for a visitor. The guards (src/routes/) read it; signing in and out
 * change it, and the screens follow.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Language } from '@/i18n/languages'
import { ApiError, ensureCsrfCookie, request } from '@/lib/http'
import type { Theme } from '@/theme/theme'

/** As sent by the backend's UserResource. */
export interface User {
  id: number
  name: string
  email: string
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
  show_rpe?: boolean
}

export const authKeys = {
  user: ['user'] as const,
}

const UPDATE_PREFERENCES_KEY = ['updatePreferences']

/**
 * A 401 is the answer "nobody" and becomes null, which the guards expect. Any
 * other error stays one: no network must not look like being signed out.
 * @throws ApiError on anything but a 401
 */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
  try {
    const answer = await request<{ data: User }>('/api/user', { signal })
    return answer.data
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

/**
 * The cache is emptied even after an error: the user wanted out. Everything
 * else is removed, so the next user on this device sees none of it; the user
 * becomes null, which sends the guards to /login.
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
 * applies it. A failed save is not undone; the account's value returns on the
 * next reload.
 *
 * The server's answers are never written into the cache: with two changes close
 * together, the second answer can carry the old value of the first. The user is
 * read again once the last change has finished.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: UPDATE_PREFERENCES_KEY,
    mutationFn: (data: PreferencesData) => request<void>('/api/user/preferences', { method: 'PATCH', body: data }),
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
