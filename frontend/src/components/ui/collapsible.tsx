/*
 * Collapsible: shadcn/ui's panel that a button opens and closes, such as the
 * exercises folded under the summary's count (docs/design/D1-ui.md D1.4.10).
 * Added with `npx shadcn add collapsible`; no package came with it, since
 * the `radix-ui` package the other components use already holds Radix's
 * Collapsible. What shadcn/ui is: card.tsx and
 * docs/concepts/C1-frontend.md C1.8.
 *
 *   <Collapsible>
 *     <CollapsibleTrigger asChild><button>Exercises</button></CollapsibleTrigger>
 *     <CollapsibleContent>…the list…</CollapsibleContent>
 *   </Collapsible>
 *
 * Radix does the work: it keeps "open" or "closed" (or takes it from the
 * `open` and `onOpenChange` props), links the trigger to the content for
 * screen readers (aria-expanded, aria-controls), and marks both with
 * data-state="open" or "closed", which the styles read.
 *
 * Ours, added to shadcn's file: the content slides open and closed. Radix
 * measures the content and puts its height in a CSS variable,
 * --radix-collapsible-content-height; tw-animate-css (imported in
 * src/index.css) has two animations that go from 0 to that height and back,
 * `animate-collapsible-down` and `animate-collapsible-up`. `overflow-hidden`
 * hides the content while its height grows. A closed panel is not in the
 * page at all, so its contents cost nothing until opened.
 */
// React's types; cn() joins classes; Radix's Collapsible, under its own name
import * as React from 'react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** The whole: holds whether it is open. Takes `open`, `defaultOpen`, `onOpenChange`. */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/** The button that opens and closes it; `asChild` lends its behaviour to a child of ours. */
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/** What opens: drawn only while open, sliding in and out. */
function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      // data-open: / data-closed: are shadcn's variants for
      // data-state="open" / "closed" (shadcn/tailwind.css)
      className={cn('overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up', className)}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
