/*
 * The title block at the top of every page: the page's name as its one <h1>
 * (screen readers use it to tell pages apart) and an optional line below.
 * The simplest component of the app, a good first read: props in, JSX out
 * (docs/04-frontend.md 4.4).
 */

/**
 * Props of PageHeader: the inputs a parent passes, written like HTML
 * attributes: <PageHeader title="Plans" description="…" />.
 */
interface PageHeaderProps {
  /** The page's name, already translated. */
  title: string
  /** One sentence about the page, already translated; optional (the `?`). */
  description?: string
}

/**
 * A component is a function that takes props and returns what to draw (JSX).
 * The props arrive as one object, here taken apart ("destructured") straight
 * in the parameter list: `{ title, description }` makes two variables out of
 * the object's two fields, and `: PageHeaderProps` gives the object its type.
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    // JSX looks like HTML but is JavaScript: `className` instead of
    // `class` (a reserved word in JavaScript), and `{title}` inserts the
    // value of a variable. The classes are Tailwind utilities, one small
    // style each: mb-6 leaves space below the header.
    <header className="mb-6">
      {/* The title: large, semibold, slightly tight letter spacing, in the
          heading font; `sm:text-3xl` makes it larger from 640 px wide up
          (Tailwind's responsive prefixes: sm: 640 px, lg: 1024 px) */}
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {/* `&&`: draw the paragraph only when there is a description. Muted
          text colour, a little space above */}
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </header>
  )
}
