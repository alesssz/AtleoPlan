/*
 * The one way the app talks to the Laravel API: a small wrapper around the
 * browser's fetch() that adds what every request needs, and turns failures
 * into a typed ApiError. Server data in components goes through TanStack
 * Query (src/api/), which calls these functions. docs/04-frontend.md 4.6.
 *
 * Why the extras:
 * - Same address: in development Vite forwards /api to Laravel, in
 *   production Caddy does (docs/02-decisions.md 2.6), so paths are relative
 *   ('/api/health') and Sanctum's session cookie travels with every request.
 * - CSRF: Sanctum protects every request that changes data (POST, PUT,
 *   PATCH, DELETE). It sets a cookie, XSRF-TOKEN, when /sanctum/csrf-cookie
 *   is called; each such request must send its value back in the
 *   X-XSRF-TOKEN header. A site on another address cannot read our cookie,
 *   so it cannot forge the header.
 * - Accept: application/json makes Laravel answer errors in JSON
 *   ({ message, errors }) instead of an HTML page or a redirect.
 * - Accept-Language makes Laravel write its messages, such as validation
 *   errors, in the user's language (backend SetLocaleFromRequest).
 *
 * No React here: plain TypeScript. The syntax met below (interfaces,
 * classes, async/await, generics) is summed up in docs/04-frontend.md 4.12.
 */
import i18n from '@/i18n'
import { FALLBACK_LANGUAGE } from '@/i18n/languages'

/** The HTTP methods the app uses: a union type, one of these exact strings. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Options of one request. An `interface` describes the shape of an object:
 * its fields and their types. A `?` after a field name makes it optional.
 */
export interface RequestOptions {
  /** HTTP method; GET when missing. */
  method?: HttpMethod
  /**
   * Data to send, as JSON; any object or array. `unknown` accepts any
   * value but, unlike `any`, forces a check before the value is used.
   */
  body?: unknown
  /** Lets TanStack Query cancel a request that is no longer needed. */
  signal?: AbortSignal
}

/**
 * An answer from the API that is not a success (status 400 and above), or a
 * request that never got an answer (status 0: offline, server down).
 *
 * A `class` is a template for objects; `extends Error` makes every ApiError
 * also a normal JavaScript Error (with a message and a stack trace), so it
 * can be thrown, and recognised later with `error instanceof ApiError`.
 */
export class ApiError extends Error {
  /**
   * The HTTP status: 401 not signed in, 403 forbidden, 404, 422 invalid data, 0 no answer.
   * `readonly`: set once, in the constructor, never changed afterwards.
   */
  readonly status: number
  /** For 422: the message of each invalid field, by field name, as Laravel sends them. */
  readonly fieldErrors: Record<string, string[]>

  /**
   * Runs on `new ApiError(…)`. `super(message)` first calls Error's own
   * constructor; `this` is the object being built.
   * @param status the HTTP status, 0 when there was no answer
   * @param message a short description, from Laravel when it sent one
   * @param fieldErrors the invalid fields of a 422; none by default
   */
  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * Methods that change data, and so need the CSRF header. A Set is a
 * collection without duplicates with a fast has(); ReadonlySet is its type
 * without the methods that change it. `<HttpMethod>` is a generic type
 * argument: a set *of* HttpMethod values.
 */
const UNSAFE_METHODS: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Laravel's status for an expired CSRF token: the session behind it is gone, as
 * when a sign-in page stays open for hours. Not a real failure: see request().
 */
const CSRF_EXPIRED_STATUS = 419

/** Reads a cookie of this site by name; undefined when it is not set. */
function readCookie(name: string): string | undefined {
  // document.cookie is one string: "a=1; XSRF-TOKEN=abc; b=2".
  // `cookie => cookie.startsWith(…)` is an arrow function (parameter =>
  // result) given to find(), which returns the first piece it accepts.
  // `${name}=` is a template literal: a string in backticks where ${…}
  // inserts a value.
  const match = document.cookie.split('; ').find(cookie => cookie.startsWith(`${name}=`))
  // `condition ? a : b` (the ternary operator): a when true, b otherwise
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

/**
 * Asks Laravel for a fresh CSRF cookie (XSRF-TOKEN). Called before the first
 * request that changes data, when the token has expired, and by sign-in
 * (src/api/auth.ts), which starts from a fresh one.
 *
 * An `async` function always returns a Promise: an object standing for a
 * result that arrives later (here, once the network answers). Inside,
 * `await` pauses the function, without freezing the page, until the
 * Promise is ready. Promise<void> means "finishes, with no value".
 */
export async function ensureCsrfCookie(): Promise<void> {
  await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
}

/**
 * Sends one request, with the headers it needs, and returns the raw answer.
 * Reads the CSRF cookie each time, so a second try uses the fresh one.
 * @param path the API path
 * @param options method, body and cancel signal
 * @returns a Promise of the server's answer
 * @throws ApiError with status 0 when there is no answer
 */
async function send(path: string, options: RequestOptions): Promise<Response> {
  // GET unless told otherwise. `a ?? b` (nullish coalescing): a, or b when
  // a is null or undefined
  const method = options.method ?? 'GET'
  // Headers of every request; more are added below when needed
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': i18n.resolvedLanguage ?? FALLBACK_LANGUAGE,
  }

  if (UNSAFE_METHODS.has(method)) {
    // The first change of a session has no CSRF cookie yet: get one
    if (!readCookie('XSRF-TOKEN')) await ensureCsrfCookie()
    headers['X-XSRF-TOKEN'] = readCookie('XSRF-TOKEN') ?? ''
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  // try { … } catch (error) { … }: when anything inside `try` throws, the
  // `catch` block runs with what was thrown, instead of the error escaping
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
    // A cancelled request is not a failure: let TanStack Query see it as such
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Network error')
  }
}

/**
 * Sends a request to the API and returns its JSON answer, typed as T.
 * Throws ApiError on any failure, so callers (and TanStack Query) only deal
 * with one kind of error.
 *
 * `<T>` makes the function generic: T is a type chosen by the caller
 * (`request<Health>(…)`), so the answer comes back typed as a Health.
 * TypeScript cannot check what the server really sends: T is a promise
 * made by the caller, kept in step with the backend by hand.
 *
 * @param path the API path, e.g. '/api/health'
 * @param options method, body and cancel signal; all optional
 * @returns a Promise of the decoded JSON answer
 * @example const health = await request<{ status: string }>('/api/health')
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // The server's answer; a network failure (offline, server down) throws here.
  // `let`, not `const`: it is replaced if the request has to be sent again.
  let response = await send(path, options)

  // An expired token: get a fresh one and try once more, so a page left open
  // for hours still works. Once, because a second 419 would not be cured by a third
  if (response.status === CSRF_EXPIRED_STATUS) {
    await ensureCsrfCookie()
    response = await send(path, options)
  }

  // 204 No Content: success with nothing to read. `as T` is a type
  // assertion: it tells TypeScript to treat the value as a T without
  // checking (callers of a 204 endpoint use request<void>)
  if (response.status === 204) return undefined as T

  // The body as JSON; null when it is not JSON (e.g. a proxy's HTML error page).
  // .catch() on a Promise supplies a value when it fails
  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // Laravel's error shape: { message: string, errors?: { field: [messages] } }
    const body = (data ?? {}) as { message?: string, errors?: Record<string, string[]> }
    throw new ApiError(response.status, body.message ?? response.statusText, body.errors)
  }
  return data as T
}
