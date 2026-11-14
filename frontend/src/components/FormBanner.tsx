/*
 * A message about the whole form (no network, too many tries) or a
 * confirmation.
 */
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormBannerProps {
  variant: 'error' | 'success'
  children: string
}

/** The icon differs too: never colour alone. */
export function FormBanner({ variant, children }: FormBannerProps) {
  const Icon = variant === 'error' ? CircleAlert : CircleCheck

  return (
    // An error interrupts a screen reader; a confirmation waits its turn
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
