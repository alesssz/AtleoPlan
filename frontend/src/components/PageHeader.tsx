/*
 * The title block at the top of every page: a small lime label (the
 * "eyebrow"), the page's name as its one <h1> (screen readers use it to tell
 * pages apart) and an optional line below. The simplest component of the
 * app, a good first read: props in, JSX out (docs/concepts/C1-frontend.md C1.4).
 * Its look follows the energetic style: docs/design/D1-ui.md D1.5 "Visual style".
 */
import { cn } from '@/lib/utils'

/**
 * Props of PageHeader: the inputs a parent passes, written like HTML
 * attributes: <PageHeader eyebrow="Training" title="Plans" description="…" />.
 */
interface PageHeaderProps {
  /** A word or two above the title, in lime capitals; optional (the `?`). */
  eyebrow?: string
  /** The page's name, already translated. */
  title: string
  /** One sentence about the page, already translated; optional. */
  description?: string
  /**
   * Extra classes for the header, merged last so they win: the sign-in
   * screens pass `mb-6`, a little less room under the title than the app's
   * pages, so the form fits a laptop's screen without scrolling.
   */
  className?: string
}

/**
 * A component is a function that takes props and returns what to draw (JSX).
 * The props arrive as one object, here taken apart ("destructured") straight
 * in the parameter list: `{ eyebrow, title, description }` makes three
 * variables out of the object's fields, and `: PageHeaderProps` gives the
 * object its type.
 */
export function PageHeader({ eyebrow, title, description, className }: PageHeaderProps) {
  return (
    // JSX looks like HTML but is JavaScript: `className` instead of
    // `class` (a reserved word in JavaScript), and `{title}` inserts the
    // value of a variable. The classes are Tailwind utilities, one small
    // style each: mb-8 leaves 32 px below the header. cn() joins it with
    // the caller's classes, and of two margins keeps the caller's
    <header className={cn('mb-8', className)}>
      {/* `&&`: draw the eyebrow only when there is one. Small (12 px), bold,
          in capitals (uppercase) with wide letter spacing, in lime */}
      {eyebrow && (
        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      )}
      {/* The title: big and heavy, letters pulled close (tracking-tight),
          in the heading font; larger from 640 px up (sm:text-4xl).
          Tailwind's responsive prefixes: sm: 640 px, lg: 1024 px */}
      <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {/* The description, muted, at most about 60 characters per line
          (max-w-prose) so it stays easy to read on wide screens */}
      {description && <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>}
    </header>
  )
}
