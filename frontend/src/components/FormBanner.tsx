/*
 * A message at the top of a form: an error about the whole form (no network,
 * too many tries), or a confirmation ("password changed"). Forms:
 * docs/04-frontend.md 4.13.
 */
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Props of FormBanner. */
interface FormBannerProps {
  /** Which kind of message: red for an error, green for a confirmation. */
  variant: 'error' | 'success'
  /** The message, already translated. */
  children: string
}

/** The message in a tinted box. Never colour alone (1.7): the icon differs too. */
export function FormBanner({ variant, children }: FormBannerProps) {
  // A component chosen at runtime goes in a capitalised variable, so JSX reads it as a component
  const Icon = variant === 'error' ? CircleAlert : CircleCheck

  return (
    // role: an error interrupts a screen reader at once (alert), a confirmation
    // waits for it to finish (status)
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-sm',
        variant === 'error' ? 'border-destructive/40 bg-destructive/10' : 'border-success/40 bg-success/10',
      )}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', variant === 'error' ? 'text-destructive' : 'text-success')} />
      <p>{children}</p>
    </div>
  )
}
