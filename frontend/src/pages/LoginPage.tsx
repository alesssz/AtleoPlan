/*
 * Sign in (route `/login`), the reference for the app's forms: a zod schema,
 * react-hook-form, a mutation and showRequestError.
 *
 * It does not navigate after signing in: the mutation updates who is signed in,
 * and RequireGuest, around this page, moves on.
 *
 * Under the form, "Continue with Google" (src/components/GoogleSignIn.tsx);
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

export function LoginPage() {
  const { t } = useTranslation()
  const signIn = useSignIn()
  // ResetPasswordPage leaves a note in the router's state
  const location = useLocation()
  const passwordChanged = (location.state as { passwordChanged?: boolean } | null)?.passwordChanged === true

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema(t)),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  function onSubmit(values: SignInValues) {
    // A wrong password comes back on the email field, as Fortify sends it
    signIn.mutate(values, {
      onError: error => showRequestError(error, form.setError, ['email', 'password'], t),
    })
  }

  return (
    <>
      {/* The eyebrow stays: these screens have no navigation saying where the user is */}
      <PageHeader eyebrow={t('auth.signIn.eyebrow')} title={t('auth.signIn.title')} description={t('auth.signIn.description')} />

      {/* noValidate: the messages come from the schema, translated */}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {passwordChanged && <FormBanner variant="success">{t('auth.resetPassword.done')}</FormBanner>}
        {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}
        <GoogleSignInError />

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

      <GoogleSignInButton />

      {/* Side by side when they fit, so the page fits a laptop's screen */}
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
