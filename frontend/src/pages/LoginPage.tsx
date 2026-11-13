/*
 * Sign in (route `/login`), docs/design/D1-ui.md D1.4.1. Also the model of a form
 * in this app, whose four pieces are: a zod schema for the rules
 * (auth-schemas.ts), react-hook-form for the fields, a mutation for the request
 * (src/api/auth.ts), and showRequestError for what the server refuses.
 * Explained step by step in docs/concepts/C1-frontend.md C1.13.
 *
 * It does not navigate after signing in: the mutation updates who is signed in,
 * and RequireGuest, around this page, moves on.
 *
 * Under the form, "Continue with Google" (FEAT-9, src/components/GoogleSignIn.tsx);
 * when Google sign-in fails, Laravel sends the browser back here with
 * `?error=…`, shown at the top of the form.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { useSignIn } from '@/api/auth'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { GoogleSignInButton, GoogleSignInError } from '@/components/GoogleSignIn'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { showRequestError } from '@/lib/form'
import { signInSchema, type SignInValues } from './auth-schemas'

/** The sign-in screen. */
export function LoginPage() {
  const { t } = useTranslation()
  // The request that signs in (src/api/auth.ts)
  const signIn = useSignIn()
  // The router's state: ResetPasswordPage leaves a note here on its way
  const location = useLocation()
  // true when the user arrives from a password just changed
  const passwordChanged = (location.state as { passwordChanged?: boolean } | null)?.passwordChanged === true

  // react-hook-form keeps the fields' values and errors. `<SignInValues>` is the
  // shape of the values; zodResolver makes it check them with the schema.
  // register, handleSubmit and the others are taken out of its result below
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema(t)),
    defaultValues: { email: '', password: '' },
  })
  // The fields' errors, kept up to date by react-hook-form
  const { errors } = form.formState

  /**
   * Runs when the form is submitted and passes the schema.
   * @param values the fields' values, already checked
   */
  function onSubmit(values: SignInValues) {
    // A wrong password comes back on the email field, as Fortify sends it
    signIn.mutate(values, {
      onError: error => showRequestError(error, form.setError, ['email', 'password'], t),
    })
  }

  return (
    <>
      {/* The eyebrow stays on the sign-in screens: they have no tab bar or
          sidebar saying where the user is (D1.5 "Page header"). PageHeader's
          own 24 px under it suits them (they used to pass className="mb-6") */}
      <PageHeader eyebrow={t('auth.signIn.eyebrow')} title={t('auth.signIn.title')} description={t('auth.signIn.description')} />

      {/* handleSubmit checks the fields first and calls onSubmit only when they
          are valid. noValidate turns off the browser's own bubbles: the messages
          come from the schema, in the app's language */}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* A confirmation after a password change */}
        {passwordChanged && <FormBanner variant="success">{t('auth.resetPassword.done')}</FormBanner>}
        {/* An error about the whole form: no network, too many tries */}
        {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}
        {/* Why signing in with Google did not work, from the address (?error=…) */}
        <GoogleSignInError />

        {/* register('email') returns what connects a field to the form: name,
            ref, onChange, onBlur. The spread (...) hands them all over as props.
            autoComplete lets password managers and phones fill the field in */}
        <FormField
          label={t('auth.fields.email')}
          type="email"
          autoComplete="username"
          inputMode="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          label={t('auth.fields.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />

        <Button type="submit" size="xl" pending={signIn.isPending}>{t('auth.signIn.submit')}</Button>
      </form>

      {/* The other way in: a link to Google, not part of the form */}
      <GoogleSignInButton />

      {/* The other screens, as links 48 px tall to tap comfortably. Side by
          side when the card is wide enough (flex-wrap: on a narrow phone the
          second goes to its own line), so the page fits a laptop's screen */}
      <nav aria-label={t('auth.otherOptions')} className="mt-2 flex flex-wrap items-center justify-center gap-x-6">
        <Link to="/forgot-password" className="flex min-h-12 items-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.signIn.forgot')}
        </Link>
        <Link to="/register" className="flex min-h-12 items-center text-sm font-semibold text-primary">
          {t('auth.signIn.noAccount')}
        </Link>
      </nav>
    </>
  )
}
