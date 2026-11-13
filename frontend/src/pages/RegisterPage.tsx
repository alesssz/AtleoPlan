/*
 * Sign up (route `/register`), docs/design/D1-ui.md D1.4.1. Built as LoginPage,
 * the model of a form (docs/concepts/C1-frontend.md C1.13). The new account starts in the
 * language of this browser, and Fortify signs the user in at once, so
 * RequireGuest, around this page, moves into the app.
 *
 * Under the form, "Continue with Google" (FEAT-9, src/components/GoogleSignIn.tsx):
 * the same button as on the sign-in page, since Google makes the account
 * when the address is new.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSignUp } from '@/api/auth'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { GoogleSignInButton } from '@/components/GoogleSignIn'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { FALLBACK_LANGUAGE, isLanguage } from '@/i18n/languages'
import { showRequestError } from '@/lib/form'
import { signUpSchema, type SignUpValues } from './auth-schemas'

/** The sign-up screen. */
export function RegisterPage() {
  const { t, i18n } = useTranslation()
  // The request that signs up (src/api/auth.ts)
  const signUp = useSignUp()
  // The form's values and errors (react-hook-form), checked with the schema
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema(t)),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })
  // The fields' errors
  const { errors } = form.formState

  /**
   * Runs when the form is submitted and passes the schema.
   * @param values the fields' values, already checked
   */
  function onSubmit(values: SignUpValues) {
    // The language in use now (the browser's, D2.4). isLanguage() is a type guard
    const locale = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE
    signUp.mutate({ ...values, locale }, {
      onError: error => showRequestError(error, form.setError, ['name', 'email', 'password', 'password_confirmation'], t),
    })
  }

  return (
    <>
      {/* The eyebrow stays on the sign-in screens: they have no tab bar or
          sidebar saying where the user is (D1.5 "Page header"). PageHeader's
          own 24 px under it suits them (they used to pass className="mb-6") */}
      <PageHeader eyebrow={t('auth.signUp.eyebrow')} title={t('auth.signUp.title')} description={t('auth.signUp.description')} />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}

        <FormField label={t('auth.fields.name')} autoComplete="name" error={errors.name?.message} {...form.register('name')} />
        <FormField label={t('auth.fields.email')} type="email" autoComplete="username" inputMode="email" error={errors.email?.message} {...form.register('email')} />
        {/* new-password: password managers offer to generate and save one */}
        <FormField label={t('auth.fields.password')} type="password" autoComplete="new-password" error={errors.password?.message} {...form.register('password')} />
        <FormField label={t('auth.fields.passwordConfirmation')} type="password" autoComplete="new-password" error={errors.password_confirmation?.message} {...form.register('password_confirmation')} />

        <Button type="submit" size="xl" pending={signUp.isPending}>{t('auth.signUp.submit')}</Button>
      </form>

      {/* The other way in: a link to Google, not part of the form */}
      <GoogleSignInButton />

      <nav aria-label={t('auth.otherOptions')} className="mt-2 flex flex-col items-center">
        <Link to="/login" className="flex min-h-12 items-center text-sm font-semibold text-primary">
          {t('auth.signUp.haveAccount')}
        </Link>
      </nav>
    </>
  )
}
