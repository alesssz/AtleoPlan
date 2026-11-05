/*
 * The new password (route `/reset-password`), the second step of "forgot
 * password": the email's link opens this screen, with the token and the address
 * in the query string (?token=…&email=…). The backend builds that link in
 * app/Providers/FortifyServiceProvider.php. Built as LoginPage
 * (docs/04-frontend.md 4.13).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useResetPassword } from '@/api/auth'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { showRequestError } from '@/lib/form'
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schemas'

/** The screen that sets a new password. */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  // The address's query string; the first item is what reads it
  const [searchParams] = useSearchParams()
  // The two values from the link; null when the address has been cut short
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  // Moves to another screen from code
  const navigate = useNavigate()
  // The request that sets the password (src/api/auth.ts)
  const resetPassword = useResetPassword()
  // The form's values and errors (react-hook-form), checked with the schema
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema(t)),
    defaultValues: { password: '', password_confirmation: '' },
  })
  // The fields' errors
  const { errors } = form.formState

  /**
   * Runs when the form is submitted and passes the schema. On success it goes to
   * /login, leaving a note in the router's state for the confirmation there.
   * An expired token comes back on `email`, which is not a visible field, so
   * showRequestError puts its message at the top.
   * @param values the fields' values, already checked
   */
  function onSubmit(values: ResetPasswordValues) {
    // The form is only drawn with both, as checked below
    if (!token || !email) return
    resetPassword.mutate({ ...values, token, email }, {
      onSuccess: () => void navigate('/login', { replace: true, state: { passwordChanged: true } }),
      onError: error => showRequestError(error, form.setError, ['password', 'password_confirmation'], t),
    })
  }

  // A link with something missing cannot work: say so, rather than draw a form
  // that can only fail
  if (!token || !email) {
    return (
      <>
        <PageHeader eyebrow={t('auth.resetPassword.eyebrow')} title={t('auth.resetPassword.invalidTitle')} description={t('auth.resetPassword.invalidText')} />
        <Button asChild size="xl" className="w-full">
          <Link to="/forgot-password">{t('auth.resetPassword.askAgain')}</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow={t('auth.resetPassword.eyebrow')} title={t('auth.resetPassword.title')} description={t('auth.resetPassword.description', { email })} />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}

        <FormField label={t('auth.fields.newPassword')} type="password" autoComplete="new-password" error={errors.password?.message} {...form.register('password')} />
        <FormField label={t('auth.fields.passwordConfirmation')} type="password" autoComplete="new-password" error={errors.password_confirmation?.message} {...form.register('password_confirmation')} />

        <Button type="submit" size="xl" disabled={resetPassword.isPending}>{t('auth.resetPassword.submit')}</Button>
      </form>

      <nav aria-label={t('auth.otherOptions')} className="mt-4 flex flex-col items-center">
        <Link to="/forgot-password" className="flex min-h-12 items-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.resetPassword.askAgain')}
        </Link>
      </nav>
    </>
  )
}
