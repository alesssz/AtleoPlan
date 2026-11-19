/*
 * Which answer a screen shows. A refresh that fails leaves TanStack Query in
 * "error" while keeping the last answer: with the server unreachable, the
 * screen opened before must still show it, as it does offline.
 */
import { ApiError } from './http'

/**
 * The last answer, unless the failure says it no longer holds: a 4xx (404,
 * 403) means the thing is gone or not the user's, and showing it would lead to
 * changes that fail.
 */
export function shownData<T>(query: { data: T | undefined, error: unknown }): T | undefined {
  const refused = query.error instanceof ApiError && query.error.status >= 400 && query.error.status < 500
  return refused ? undefined : query.data
}
