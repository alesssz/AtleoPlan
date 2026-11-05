/*
 * The rules of the sign-in forms, written with zod: what is valid, and what to
 * say when it is not. They catch mistakes before anything is sent, in the user's
 * language; the backend checks everything again, because a browser can be made to
 * send anything (backend app/Actions/Fortify/). docs/04-frontend.md 4.13.
 *
 * A zod schema describes the shape of some data. Given to react-hook-form
 * (zodResolver), it runs on submit. Each schema is built by a function taking
 * `t`, so its messages are in the current language. The types of the form values
 * are derived from the schemas (z.infer), so the two cannot drift apart.
 */
import type { TFunction } from 'i18next'
import { z } from 'zod'

/** Shortest password accepted; the same as the backend's Password::default(). */
const PASSWORD_MIN_LENGTH = 8

/**
 * The rule of an email field.
 * z.email() accepts only a well-formed address; `error` is the message otherwise.
 */
function emailField(t: TFunction) {
  return z.email({ error: t('auth.errors.email') })
}

/** The rule of a new password. */
function newPasswordField(t: TFunction) {
  return z.string().min(PASSWORD_MIN_LENGTH, { error: t('auth.errors.passwordLength', { count: PASSWORD_MIN_LENGTH }) })
}

/**
 * The sign-in form. The password only has to be there: it is the server that
 * knows whether it is right, and an old account may have a shorter one.
 */
export function signInSchema(t: TFunction) {
  return z.object({
    email: emailField(t),
    password: z.string().min(1, { error: t('auth.errors.required') }),
  })
}

/** The values of the sign-in form. */
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>

/**
 * The sign-up form. refine() adds a rule across two fields, and `path` says which
 * field shows its message.
 */
export function signUpSchema(t: TFunction) {
  return z.object({
    // trim(): spaces around a name do not count
    name: z.string().trim().min(1, { error: t('auth.errors.required') }),
    email: emailField(t),
    password: newPasswordField(t),
    password_confirmation: z.string(),
  }).refine(values => values.password === values.password_confirmation, {
    error: t('auth.errors.passwordMatch'),
    path: ['password_confirmation'],
  })
}

/** The values of the sign-up form. */
export type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>

/** The "forgot password" form. */
export function forgotPasswordSchema(t: TFunction) {
  return z.object({ email: emailField(t) })
}

/** The values of the "forgot password" form. */
export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>

/** The "new password" form; the email and the token come from the link. */
export function resetPasswordSchema(t: TFunction) {
  return z.object({
    password: newPasswordField(t),
    password_confirmation: z.string(),
  }).refine(values => values.password === values.password_confirmation, {
    error: t('auth.errors.passwordMatch'),
    path: ['password_confirmation'],
  })
}

/** The values of the "new password" form. */
export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>
