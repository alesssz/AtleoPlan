/*
 * The title block at the top of every page: the page's name as its one <h1>
 * (screen readers use it to tell pages apart), the page's main actions on the
 * same row, an optional small line below, and, only where it adds something,
 * a small lime label above (the "eyebrow"). The simplest component of the
 * app, a good first read: props in, JSX out (docs/concepts/C1-frontend.md C1.4).
 * Its look follows the energetic style: docs/design/D1-ui.md D1.5 "Visual style";
 * why it is compact: D1.5 "Page header".
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Props of PageHeader: the inputs a parent passes, written like HTML
 * attributes: <PageHeader title="Plans" description="…" actions={…} />.
 */
interface PageHeaderProps {
  /**
   * A word or two above the title, in lime capitals; optional (the `?`).
   * Only when it says something the title and the tab bar do not: the
   * workout's date, "Edit plan" above the plan's name. Not the section's
   * name, which the tab bar already shows (D1.5 "Page header").
   */
  eyebrow?: string
  /** The page's name, already translated. */
  title: string
  /** One sentence about the page, already translated, in small muted text; optional. */
  description?: string
  /**
   * The page's main actions, drawn at the right of the title, such as the
   * New exercise button; optional. `ReactNode` is React's type for anything
   * that can be drawn: an element, a text, a list of them, or nothing. A
   * prop of that type lets the parent pass ready-made JSX, here the buttons.
   */
  actions?: ReactNode
  /**
   * Extra classes for the header, merged last so they win over its own
   * (cn(), src/lib/utils.ts): a page can change the room under the header.
   */
  className?: string
}

/**
 * A component is a function that takes props and returns what to draw (JSX).
 * The props arrive as one object, here taken apart ("destructured") straight
 * in the parameter list: `{ eyebrow, title, description, actions, className }`
 * makes five variables out of the object's fields, and `: PageHeaderProps`
 * gives the object its type.
 */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    // JSX looks like HTML but is JavaScript: `className` instead of
    // `class` (a reserved word in JavaScript), and `{title}` inserts the
    // value of a variable. The classes are Tailwind utilities, one small
    // style each: mb-6 leaves 24 px below the header. cn() joins it with
    // the caller's classes, and of two margins keeps the caller's
    <header className={cn('mb-6', className)}>
      {/* `&&`: draw the eyebrow only when there is one. Small (12 px), bold,
          in capitals (uppercase) with wide letter spacing, in lime */}
      {eyebrow && (
        <p className="mb-1 text-xs font-bold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      )}

      {/* The title and the actions on one row: flex puts them side by side,
          justify-between pushes the actions to the right edge, items-center
          lines them up on the middle. flex-wrap: when both do not fit (a
          long plan name, a narrow phone), the actions move to a row of their
          own instead of squeezing the title; gap-y-3 is the room between the
          two rows then, gap-x-4 the room between title and actions */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* The title: heavy, letters pulled close (tracking-tight), in the
            heading font; larger from 640 px up (sm:text-3xl). Tailwind's
            responsive prefixes: sm: 640 px, lg: 1024 px. min-w-0 and
            break-words: a very long word breaks instead of overflowing */}
        <h1 className="min-w-0 font-heading text-2xl font-extrabold tracking-tight break-words sm:text-3xl">{title}</h1>
        {/* The actions, side by side 8 px apart; shrink-0: never squeezed */}
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {/* The description: small (14 px) and muted, at most about 60
          characters per line (max-w-prose) so it stays easy to read on
          wide screens */}
      {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
    </header>
  )
}
