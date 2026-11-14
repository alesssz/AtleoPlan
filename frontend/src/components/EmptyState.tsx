/*
 * An empty list or screen: an illustration, a sentence and the main action,
 * never a blank page. The illustration is CSS only: the section's icon in a
 * glowing, ringed circle.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
  /** While the feature is not built: its action shows disabled, with the badge. */
  comingSoon?: boolean
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actions, comingSoon, className }: EmptyStateProps) {
  return (
    <section className={cn('border-glow flex flex-col items-center rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16', className)}>
      <div aria-hidden="true" className="relative mb-8 grid size-28 place-items-center">
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div className="absolute -inset-4 rounded-full border border-primary/10" />
        <div className="relative grid size-20 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Icon className="size-9 text-primary" strokeWidth={1.75} />
        </div>
      </div>

      {comingSoon && <ComingSoon className="mb-4" />}

      <h2 className="font-heading text-2xl font-extrabold tracking-tight text-balance">{title}</h2>
      <p className="mt-3 max-w-md text-muted-foreground text-balance">{description}</p>

      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </section>
  )
}
