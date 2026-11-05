/*
 * Separator: shadcn/ui's dividing line, horizontal (between stacked
 * sections) or vertical (between items in a row).
 *
 * shadcn/ui copies each component's source into src/components/ui/, so
 * this file is ours to read; this one wraps Radix's Separator primitive,
 * which adds the right accessibility attributes. Styles: docs/04-frontend.md 4.8.
 *
 *   <Separator />                         a 1 px line across the width
 *   <Separator orientation="vertical" />  a 1 px line as tall as its row
 */
// 'use client' marks a component for the browser in frameworks with server
// components (Next.js). This app runs entirely in the browser, so it has no
// effect here; shadcn/ui ships it and it is kept to match upstream.
'use client'

// All of React's exports in one object; used for its types
import * as React from 'react'
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'
// Radix's Separator, renamed on import so ours can be called Separator
import { Separator as SeparatorPrimitive } from 'radix-ui'

/**
 * A thin line in the border colour. Props (Radix's, plus any <div> prop):
 * - orientation: 'horizontal' (default) or 'vertical';
 * - decorative: true (default) when the line is only visual, so screen
 *   readers skip it; false when it really separates content, so it is
 *   announced as a separator (role="separator").
 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    // Radix sets data-orientation; the data-horizontal: / data-vertical:
    // variants turn it into 1 px tall and full width, or 1 px wide and
    // stretched to the row's height
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
        className,
      )}
      {...props}
    />
  )
}

// Named export, shadcn/ui's habit
export { Separator }
