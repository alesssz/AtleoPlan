/*
 * Switch: shadcn/ui's on/off toggle, used by Profile for the rest timer's
 * sound and vibration (docs/design/D1-ui.md D1.4.14). Added with
 * `npx shadcn add switch` (docs/how-to/H3-frontend.md H3.21); what shadcn/ui
 * is: card.tsx and docs/concepts/C1-frontend.md C1.8.
 *
 *   <Switch id={id} checked={on} onCheckedChange={setOn} />
 *
 * Built on Radix's Switch: a <button role="switch"> with aria-checked, so
 * screen readers say "on" or "off", and Space toggles it. Its state shows in
 * `data-checked` / `data-unchecked`, which the classes read (lime when on).
 *
 * Changes from shadcn's file: our style (quotes, no semicolons), the
 * comments, and a third size, `lg` (48 × 28 px), the one Profile uses: the
 * default (32 × 18) is small for a finger. `after:-inset-x-3 after:-inset-y-2`
 * already widens the area that reacts to a tap beyond the drawn switch.
 */
// React's types; cn() joins classes; Radix's Switch
import * as React from 'react'
import { cn } from 'cn'
import { Switch as SwitchPrimitive } from 'radix-ui'

/** The switch: `checked` and `onCheckedChange` control it; `size` its size. */
function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=lg]:h-7 data-[size=lg]:w-12 data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* The round thumb, which slides to the right when on */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=lg]/switch:size-6 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=lg]/switch:data-checked:translate-x-[calc(100%-4px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=lg]/switch:data-unchecked:translate-x-0.5 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
