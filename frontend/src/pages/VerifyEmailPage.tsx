/*
 * All an account sees until its address is confirmed: RequireAuth shows it in
 * place of every page, since the server refuses them. The email's link opens
 * in whatever browser the mail app picks, often not this one, so the screen
 * asks the server again on "I've confirmed it" and when the app comes back to
 * the front (TanStack Query's refetch on focus).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useSendVerificationEmail, useSignOut, type User } from '@/api/auth'
import { FormBanner } from '@/components/FormBanner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { ApiError, TOO_MANY_REQUESTS } from '@/lib/http'

export function VerifyEmailPage({ user }: { user: User }) {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const send = useSendVerificationEmail()
  const signOut = useSignOut()
  // Set by the check, so it is not shown before the user has asked
  const [notYet, setNotYet] = useState(false)

  async function check() {
    const answer = await currentUser.refetch()
    setNotYet(answer.data?.email_verified === false)
  }

  function sendAgain() {
    setNotYet(false)
    send.mutate()
  }

  const status = send.error instanceof ApiError ? send.error.status : undefined
  const sendError = status === 0
    ? t('auth.errors.network')
    : status === TOO_MANY_REQUESTS ? t('auth.errors.tooMany') : t('auth.errors.unexpected')

  return (
    <>
      <PageHeader
        eyebrow={t('auth.verifyEmail.eyebrow')}
        title={t('auth.verifyEmail.title')}
        description={t('auth.verifyEmail.description', { email: user.email })}
      />

      <div className="flex flex-col gap-5">
        {notYet && <FormBanner variant="error">{t('auth.verifyEmail.notYet')}</FormBanner>}
        {send.isSuccess && <FormBanner variant="success">{t('auth.verifyEmail.sent')}</FormBanner>}
        {send.isError && <FormBanner variant="error">{sendError}</FormBanner>}

        <Button size="xl" onClick={() => void check()} pending={currentUser.isFetching}>{t('auth.verifyEmail.check')}</Button>
        <Button size="xl" variant="outline" onClick={sendAgain} pending={send.isPending}>{t('auth.verifyEmail.sendAgain')}</Button>
      </div>

      {/* A mistyped address cannot be corrected here: a new account with the
          right one is the way */}
      <div className="mt-4 flex flex-col items-center text-center text-sm text-muted-foreground">
        <p>{t('auth.verifyEmail.wrongAddress')}</p>
        <Button variant="link" className="min-h-12 font-semibold" onClick={() => signOut.mutate()} pending={signOut.isPending}>
          {t('auth.verifyEmail.signOut')}
        </Button>
      </div>
    </>
  )
}
