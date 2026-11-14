/*
 * Every page's title block: its one <h1>, its main actions on the same row, an
 * optional line below and, only where it adds something, an eyebrow above.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /**
   * Only when it says something the title and the tab bar do not: the workout's
   * date, "Edit plan". Never the section's name.
   */
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  /** Merged last, so a page can change the room under the header. */
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {eyebrow && (
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      )}

      {/* The actions wrap to their own row rather than squeezing a long title */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="min-w-0 font-heading text-2xl font-extrabold tracking-tight break-words sm:text-3xl">{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
    </header>
  )
}
