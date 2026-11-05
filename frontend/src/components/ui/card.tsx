/*
 * Card: shadcn/ui's card, a rounded panel that groups related content
 * (Profile's "Preferences" and "Server" boxes, PagePlaceholder).
 *
 * shadcn/ui copies each component's source into src/components/ui/ (its
 * CLI, configured by components.json), so this file is ours to read; it is
 * styled with Tailwind and the theme's colour tokens (docs/04-frontend.md
 * 4.8). A card is not one component but a family of small ones that fit
 * together, each a styled <div>:
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>…</CardTitle>
 *       <CardDescription>…</CardDescription>
 *       <CardAction>…</CardAction>      (optional: a button at the top right)
 *     </CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>        (optional)
 *   </Card>
 *
 * Each part sets a data-slot attribute naming it ("card-header"…). The
 * parts' classes use it to adapt to their neighbours: for example
 * `has-data-[slot=card-footer]:pb-0` ("if it contains a footer, no bottom
 * padding") lets the footer reach the card's edge. Every part also takes a
 * `className` to add or override classes, merged by cn().
 */
// All of React's exports in one object; used for its types
import * as React from 'react'
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'

/**
 * The panel itself. Takes every prop of a <div>, plus `size`: 'default'
 * (16 px spacing) or 'sm' (12 px, for dense lists).
 * `...props` (rest) collects the other props; `{...props}` spreads them
 * onto the <div> (children included).
 */
function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      // In short: a column of parts with rounded corners, the card colours
      // and a faint 1 px ring as its border. The spacing is a CSS variable,
      // --card-spacing (16 px, 12 px when data-size is 'sm'), used for the
      // gaps and padding of every part: `gap-(--card-spacing)` is Tailwind's
      // shorthand for "gap: var(--card-spacing)". A first or last <img>
      // reaches the edges and gets the rounded corners. group/card lets
      // children style themselves by the card's state (group-data-[size=sm]/card:).
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The top of the card: title, description and an optional action. A grid
 * that adds a second column when a CardAction is present, and a second row
 * when there is a description; extra bottom padding if given a border-b.
 * `@container/card-header` makes it a container that children can size
 * themselves against.
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The card's title: heading font, medium weight; smaller in a 'sm' card.
 * A <div>, not a heading: wrap or replace it when the page's outline needs an <h2>.
 */
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm',
        className,
      )}
      {...props}
    />
  )
}

/** A line under the title, in the muted text colour. */
function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * A control (e.g. a button) placed in the header's top-right corner: second
 * column, spanning the title and description rows, aligned to the end.
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

/** The card's body: only side padding, the card's gap spaces it from the header. */
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-(--card-spacing)', className)}
      {...props}
    />
  )
}

/**
 * The bottom strip, for actions: a row with a top border on a faintly
 * tinted background, reaching the card's bottom edge.
 */
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)',
        className,
      )}
      {...props}
    />
  )
}

// Named exports listed at the end, shadcn/ui's habit
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
