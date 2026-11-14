/*
 * The one way the app talks to the API: fetch() with what every request needs,
 * and every failure turned into an ApiError.
 *
 * - Relative paths: Vite in development and Caddy in production forward /api to
 *   Laravel, so Sanctum's session cookie travels with every request.
 * - CSRF: every request that changes data sends the XSRF-TOKEN cookie back
 *   in X-XSRF-TOKEN, which another site cannot read to forge.
 * - Accept: application/json, so Laravel answers errors in JSON rather than
 *   with an HTML page or a redirect.
 * - Accept-Language, so validation messages arrive translated.
 */
import i18n from '@/i18n'
import { FALLBACK_LANGUAGE } from '@/i18n/languages'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  /** Sent as JSON. */
  body?: unknown
  signal?: AbortSignal
}

/** A status of 400 and above, or 0 when no answer came (offline, server down). */
export class ApiError extends Error {
  readonly status: number
  /** For a 422: Laravel's messages by field. */
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const UNSAFE_METHODS: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * An expired CSRF token, as when a sign-in page stays open for hours: not a
 * real failure (see request()).
 */
const CSRF_EXPIRED_STATUS = 419

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find(cookie => cookie.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

/** A fresh XSRF-TOKEN cookie. */
export async function ensureCsrfCookie(): Promise<void> {
  await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
}

/**
 * Reads the CSRF cookie on every call, so a retry uses the fresh one.
 * @throws ApiError with status 0 when there is no answer
 */
async function send(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': i18n.resolvedLanguage ?? FALLBACK_LANGUAGE,
  }

  if (UNSAFE_METHODS.has(method)) {
    // The first change of a session has no cookie yet
    if (!readCookie('XSRF-TOKEN')) await ensureCsrfCookie()
    headers['X-XSRF-TOKEN'] = readCookie('XSRF-TOKEN') ?? ''
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  try {
    return await fetch(path, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    })
  }
  catch (error) {
    // A cancelled request must reach TanStack Query as a cancellation
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Network error')
  }
}

/**
 * The decoded JSON answer, typed as T: a promise of the caller's, kept in
 * step with the backend by hand.
 * @throws ApiError on any failure
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options)

  // Once more with a fresh token, so a page left open for hours still works;
  // a second 419 would not be cured by a third
  if (response.status === CSRF_EXPIRED_STATUS) {
    await ensureCsrfCookie()
    response = await send(path, options)
  }

  // Callers of a 204 endpoint use request<void>
  if (response.status === 204) return undefined as T

  // null when the body is not JSON, such as a proxy's HTML error page
  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const body = (data ?? {}) as { message?: string, errors?: Record<string, string[]> }
    throw new ApiError(response.status, body.message ?? response.statusText, body.errors)
  }
  return data as T
}

/**
 * A multipart upload that reports the share sent, for exercise photos: 10 MB on
 * a phone's connection takes seconds. fetch() cannot report a request's
 * progress, XMLHttpRequest can; the rest mirrors request(): same headers but
 * Content-Type (the browser writes the multipart boundary), CSRF, one retry
 * after a 419, ApiError.
 *
 * @param onProgress the share sent, from 0 to 1
 */
export async function upload<T>(path: string, form: FormData, onProgress?: (share: number) => void): Promise<T> {
  if (!readCookie('XSRF-TOKEN')) await ensureCsrfCookie()

  const attempt = () => new Promise<{ status: number, data: unknown }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', path)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.setRequestHeader('Accept-Language', i18n.resolvedLanguage ?? FALLBACK_LANGUAGE)
    xhr.setRequestHeader('X-XSRF-TOKEN', readCookie('XSRF-TOKEN') ?? '')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      let data: unknown
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null
      }
      catch {
        data = null
      }
      resolve({ status: xhr.status, data })
    }
    xhr.onerror = () => reject(new ApiError(0, 'Network error'))
    xhr.send(form)
  })

  let answer = await attempt()
  if (answer.status === CSRF_EXPIRED_STATUS) {
    await ensureCsrfCookie()
    answer = await attempt()
  }

  if (answer.status < 200 || answer.status >= 300) {
    const body = (answer.data ?? {}) as { message?: string, errors?: Record<string, string[]> }
    throw new ApiError(answer.status, body.message ?? 'Upload failed', body.errors)
  }
  return answer.data as T
}
