/*
 * NativeSelect: the browser's own <select>, styled like the other fields.
 * Added with `npx shadcn add native-select`; what shadcn/ui is: card.tsx and
 * docs/concepts/C1-frontend.md C1.8.
 *
 * Used for the library's filters and the exercise editor rather than the
 * Radix Select of select.tsx, because a native list opens the phone's own
 * picker, works with every keyboard and screen reader, and needs no code to
 * position a popup. It is a plain <select>, so it works with `value` and
 * `onChange`, and with react-hook-form's register():
 *
 *   <NativeSelect value={muscle} onChange={event => setMuscle(event.target.value)}>
 *     <NativeSelectOption value="">All muscles</NativeSelectOption>
 *     <NativeSelectOption value="chest">Chest</NativeSelectOption>
 *   </NativeSelect>
 *
 * The <select> sits in a <div> that also draws the arrow; `className` goes on
 * that wrapper, so width classes (w-full) apply to the whole field.
 */
// React's types; cn() joins classes; the arrow icon from lucide
import * as React from 'react'
import { cn } from 'cn'
import { ChevronDownIcon } from 'lucide-react'

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default'
}

/** The field: a styled <select> in a wrapper that draws the arrow. `size` is 'default' (32 px) or 'sm'; every other prop goes to the <select>. */
function NativeSelect({
  className,
  size = 'default',
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        {...props}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none" aria-hidden="true" data-slot="native-select-icon" />
    </div>
  )
}

/** One choice of the list: an <option>, with the system's colours so it stays readable in both themes. */
function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  )
}

/** A named group of choices: an <optgroup>. */
function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
