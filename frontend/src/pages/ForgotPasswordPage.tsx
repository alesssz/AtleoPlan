/*
 * "Forgot password" (route `/forgot-password`), the first of two steps: it asks
 * for the address and sends the email. Its link opens ResetPasswordPage. In
 * development the email is in Mailpit (http://localhost:8525). Built as
 * LoginPage.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useForgotPassword } from '@/api/auth'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { showRequestError } from '@/lib/form'
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schemas'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const forgotPassword = useForgotPassword()
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema(t)),
    defaultValues: { email: '' },
  })
  const { errors } = form.formState

  function onSubmit(values: ForgotPasswordValues) {
    forgotPassword.mutate(values.email, {
      onError: error => showRequestError(error, form.setError, ['email'], t),
    })
  }

  return (
    <>
      {/* The eyebrow stays: these screens have no navigation saying where the user is */}
      <PageHeader eyebrow={t('auth.forgotPassword.eyebrow')} title={t('auth.forgotPassword.title')} description={t('auth.forgotPassword.description')} />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {forgotPassword.isSuccess && <FormBanner variant="success">{t('auth.forgotPassword.sent')}</FormBanner>}
        {errors.root?.message && <FormBanner variant="error">{errors.root.message}</FormBanner>}

        <FormField label={t('auth.fields.email')} type="email" autoComplete="username" inputMode="email" error={errors.email?.message} {...form.register('email')} />

        <Button type="submit" size="xl" pending={forgotPassword.isPending}>{t('auth.forgotPassword.submit')}</Button>
      </form>

      <nav aria-label={t('auth.otherOptions')} className="mt-2 flex flex-col items-center">
        <Link to="/login" className="flex min-h-12 items-center text-sm font-semibold text-primary">
          {t('auth.backToSignIn')}
        </Link>
      </nav>
    </>
  )
}
