/*
 * Textarea: a multi-line text field, styled like Input (input.tsx). Used for
 * the description and the instructions of the exercise editor. Added with
 * `npx shadcn add textarea`; what shadcn/ui is: card.tsx and
 * docs/concepts/C1-frontend.md C1.8.
 *
 * `field-sizing-content` makes it grow with its text, in the browsers that
 * support it; min-h-16 keeps it at least 64 px tall.
 */
// React's types; cn() joins classes
import * as React from 'react'
import { cn } from 'cn'

/** The field. Takes every prop of a <textarea>. */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
