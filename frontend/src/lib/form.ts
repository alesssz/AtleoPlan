/*
 * Shows a failed request's errors in a form made with react-hook-form
 * (docs/04-frontend.md 4.13). No React here: plain TypeScript.
 *
 * Laravel answers an invalid form with one message per field. A message about a
 * field on the screen goes under that field; any other goes at the top of the
 * form, with the failures that belong to no field (no network, too many tries).
 */
import type { TFunction } from 'i18next'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './http'

/** Laravel's status when too many attempts were made. */
const TOO_MANY_REQUESTS_STATUS = 429

/**
 * Puts a request's error on the form.
 *
 * `<T extends FieldValues>`: T is the shape of this form's values, so the
 * compiler checks that `fields` holds real field names.
 *
 * @param error what the request threw
 * @param setError react-hook-form's function that marks a field as wrong
 * @param fields the form's visible fields
 * @param t the translate function, for the errors that belong to no field
 */
export function showRequestError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  t: TFunction,
): void {
  // Not one of ours, or an answer with no field errors: an empty list
  const fieldErrors = error instanceof ApiError ? Object.entries(error.fieldErrors) : []
  // Set to true when a message found its place, here or at the top
  let shown = false

  for (const [field, messages] of fieldErrors) {
    // Laravel may send several messages for one field; the first is enough.
    // includes() needs the field typed as one of the names, hence the `as`
    if (fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { message: messages[0] })
    }
    else {
      // 'root' is react-hook-form's place for an error about the whole form.
      // A field that is not on the screen, such as the reset link's email
      setError('root', { message: messages[0] })
    }
    shown = true
  }
  if (shown) return

  // No message from the backend: one of ours, by the kind of failure
  const status = error instanceof ApiError ? error.status : undefined
  // status 0 is no answer at all (ApiError in src/lib/http.ts)
  if (status === 0) setError('root', { message: t('auth.errors.network') })
  else if (status === TOO_MANY_REQUESTS_STATUS) setError('root', { message: t('auth.errors.tooMany') })
  else setError('root', { message: t('auth.errors.unexpected') })
}
