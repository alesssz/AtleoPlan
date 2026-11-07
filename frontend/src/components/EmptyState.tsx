/*
 * EmptyState: what a list or a screen shows when it has nothing yet, as
 * the design asks (docs/design/D1-ui.md D1.5 component list, and D1.6 "Empty
 * states"): an illustration, a sentence and the main action, never a blank
 * page. While a feature is not built, its action is shown disabled with a
 * "Coming soon" badge (`comingSoon`), so the screen already looks the way it
 * will, and it is honest about what works.
 *
 * The illustration is drawn with CSS, no image file: the section's icon in a
 * lime-tinted circle, surrounded by two faint rings and a blurred glow.
 * Components, props and `children`: docs/concepts/C1-frontend.md C1.4; styles: C1.8.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { cn } from '@/lib/utils'

/** Props of EmptyState. */
interface EmptyStateProps {
  /** The icon of the illustration, a lucide component (e.g. ClipboardList). */
  icon: LucideIcon
  /** The headline, already translated. */
  title: string
  /** One or two sentences under it, already translated. */
  description: string
  /**
   * The buttons, usually one main action and maybe a second one. A prop
   * of type ReactNode accepts any JSX, so the page decides what they are.
   */
  actions?: ReactNode
  /** True while the feature is not built: shows the "Coming soon" badge. */
  comingSoon?: boolean
  /** Extra classes for the outer box. */
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actions, comingSoon, className }: EmptyStateProps) {
  // `icon: Icon` in the parameter list renames the prop while destructuring:
  // JSX needs a capitalised name (<Icon />) to treat it as a component

  return (
    // The box: a card with the gradient border (border-glow, src/index.css),
    // generous padding, everything centred in a column. rounded-3xl: 24 px corners
    <section className={cn('border-glow flex flex-col items-center rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16', className)}>
      {/* The illustration: a 112 px square holding layered circles.
          `relative` makes it the reference box for its `absolute` children,
          which are stacked on top of each other inside it */}
      <div aria-hidden="true" className="relative mb-8 grid size-28 place-items-center">
        {/* A blurred lime disc behind everything: the glow */}
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" />
        {/* Two thin rings, the outer one fainter (border colour at 20% and 10%) */}
        <div className="absolute inset-0 rounded-full border border-primary/20" />
        <div className="absolute -inset-4 rounded-full border border-primary/10" />
        {/* The icon's circle: lime-tinted background, lime icon, inner ring */}
        <div className="relative grid size-20 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Icon className="size-9 text-primary" strokeWidth={1.75} />
        </div>
      </div>

      {/* "Coming soon": a small pill in the warning colour (amber), shown
          only while the feature is missing (src/components/ComingSoon.tsx) */}
      {comingSoon && <ComingSoon className="mb-4" />}

      {/* The headline and the sentence; text-balance spreads a long title
          over lines of similar length instead of leaving one word alone */}
      <h2 className="font-heading text-2xl font-extrabold tracking-tight text-balance">{title}</h2>
      <p className="mt-3 max-w-md text-muted-foreground text-balance">{description}</p>

      {/* The actions, if any: in a row that wraps on narrow screens */}
      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </section>
  )
}
