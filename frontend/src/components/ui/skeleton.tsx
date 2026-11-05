/*
 * Skeleton: shadcn/ui's loading placeholder, a grey shape that pulses
 * where content will appear (the design's loading state, never a spinner
 * over the whole page: docs/01-ui-design.md 1.6). Give it the size and shape
 * of what it stands for through className:
 *   <Skeleton className="h-4 w-40" />              a line of text
 *   <Skeleton className="size-3 rounded-full" />   a dot
 * Used by src/components/ServerStatus.tsx. shadcn/ui copies each
 * component's source into src/components/ui/, so this file is ours to read.
 * Styles: docs/04-frontend.md 4.8.
 */
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'

/**
 * A pulsing grey block. Takes every prop of a <div>; `className` sets its
 * size and shape and wins over the defaults (cn() resolves the conflict,
 * so rounded-full replaces rounded-md). `React` is not imported: here it is
 * only used for a type, which TypeScript finds in React's global types.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    // data-slot names the part; animate-pulse fades it in and out, in the
    // muted colour, with slightly rounded corners
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// Named export, shadcn/ui's habit
export { Skeleton }
