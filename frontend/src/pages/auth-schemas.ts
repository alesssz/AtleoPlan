/*
 * The sign-in forms' rules: mistakes are caught before anything is sent, in the
 * user's language; the backend checks everything again. Each schema takes `t`,
 * so its messages follow the current language.
 */
import type { TFunction } from 'i18next'
import { z } from 'zod'

/** Shortest password accepted; the same as the backend's Password::default(). */
const PASSWORD_MIN_LENGTH = 8

function emailField(t: TFunction) {
  return z.email({ error: t('auth.errors.email') })
}

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

export type SignInValues = z.infer<ReturnType<typeof signInSchema>>

export function signUpSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, { error: t('auth.errors.required') }),
    email: emailField(t),
    password: newPasswordField(t),
    password_confirmation: z.string(),
  }).refine(values => values.password === values.password_confirmation, {
    error: t('auth.errors.passwordMatch'),
    path: ['password_confirmation'],
  })
}

export type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>

export function forgotPasswordSchema(t: TFunction) {
  return z.object({ email: emailField(t) })
}

export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>

/** The email and the token come from the link. */
export function resetPasswordSchema(t: TFunction) {
  return z.object({
    password: newPasswordField(t),
    password_confirmation: z.string(),
  }).refine(values => values.password === values.password_confirmation, {
    error: t('auth.errors.passwordMatch'),
    path: ['password_confirmation'],
  })
}

export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>
