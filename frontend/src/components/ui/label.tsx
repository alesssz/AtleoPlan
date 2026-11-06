/*
 * Label: shadcn/ui's field label, built on Radix (a library of accessible,
 * unstyled components). Linked to its field through `htmlFor`, so a tap on the
 * label focuses the field and screen readers read them together.
 * Copied into the project by shadcn/ui: docs/concepts/C1-frontend.md C1.8.
 */
import * as React from 'react'
import { cn } from 'cn'
import { Label as LabelPrimitive } from 'radix-ui'

/**
 * A styled <label>. `typeof LabelPrimitive.Root` is the type of Radix's
 * component; ComponentProps gives the props it accepts.
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
