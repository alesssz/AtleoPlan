/*
 * A failed request's errors on a react-hook-form form: a field on the screen
 * gets its message under it; anything else, and failures that belong to no
 * field (no network, too many tries), goes at the top of the form.
 */
import type { TFunction } from 'i18next'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './http'

const TOO_MANY_REQUESTS_STATUS = 429
export function showRequestError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  t: TFunction,
): void {
  const fieldErrors = error instanceof ApiError ? Object.entries(error.fieldErrors) : []
  let shown = false

  for (const [field, messages] of fieldErrors) {
    // The first of a field's messages is enough
    if (fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { message: messages[0] })
    }
    else {
      // A field not on the screen, such as the reset link's email
      setError('root', { message: messages[0] })
    }
    shown = true
  }
  if (shown) return

  const status = error instanceof ApiError ? error.status : undefined
  if (status === 0) setError('root', { message: t('auth.errors.network') })
  else if (status === TOO_MANY_REQUESTS_STATUS) setError('root', { message: t('auth.errors.tooMany') })
  else setError('root', { message: t('auth.errors.unexpected') })
}
