/*
 * Input: shadcn/ui's text field. shadcn/ui copies each component's source into
 * src/components/ui/, so this file is ours to read and change
 * (docs/04-frontend.md 4.8). Its default height, 32 px, is for mouse use: on
 * touch screens pass a taller one, as FormField does (src/components/FormField.tsx).
 */
import * as React from 'react'
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'

/**
 * A styled <input>. `React.ComponentProps<'input'>` is the type of every prop a
 * real <input> accepts, so it can be used like one. `...props` collects the
 * remaining props and hands them all on, including react-hook-form's `ref`
 * and `onChange`. aria-invalid: draws the field in red when it holds an error.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
