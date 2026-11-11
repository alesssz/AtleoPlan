/*
 * Spinner: shadcn/ui's small turning circle, for "a request is running" in
 * a spot that already has content: inside a button that is saving, inside
 * a search box while the list is being read again. Never over a whole page:
 * a page that has nothing to show yet uses Skeleton (src/components/ui/
 * skeleton.tsx) instead (docs/design/D1-ui.md D1.6).
 *
 * Added with shadcn/ui's CLI, `npx shadcn add spinner` (docs/how-to/
 * H3-frontend.md H3.27; the idea: docs/concepts/C1-frontend.md C1.20), then
 * adapted: shadcn's version always says
 * "Loading" in English to screen readers; this one is silent unless given
 * a `label`, so a button can say it is busy in its own way (aria-busy, see
 * src/components/ui/button.tsx) and a search box in the user's language.
 *
 *   <Spinner />                                  decorative, 16 px
 *   <Spinner label={t('exercises.searching')} /> announced, for screen readers
 */
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'
// Loader2Icon: Lucide's open circle; turning, it reads as "wait"
import { Loader2Icon } from 'lucide-react'

/** Props of Spinner: every prop of an <svg>, plus `label`. */
interface SpinnerProps extends React.ComponentProps<'svg'> {
  /**
   * What screen readers say, such as "Searching…". Given, the spinner is a
   * live status (role="status"); left out, it is hidden from them, because
   * what is around it already says it (a button with aria-busy).
   */
  label?: string
}

/**
 * The turning circle. `animate-spin` is Tailwind's one-turn-a-second
 * rotation; it keeps turning even with the device's reduced-motion setting,
 * because here the movement is the message: a still circle would look like
 * an icon, not like waiting. `className` sets another size (size-5…).
 *
 * Its own size is written `h-4 w-4`, not shadcn's `size-4`, on purpose:
 * Button sizes every icon whose classes have no "size-" in them (20 px on
 * its xl buttons, 12 px on xs…, see button.tsx), so inside a button the
 * spinner is as big as the icon it replaces. Alone, it is 16 px.
 */
function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    // data-slot="spinner" names the part, so the Button can tell it from
    // its own icons and hide those while it waits. The `label ? … : …`
    // pairs give either a named status or a hidden decoration
    <Loader2Icon
      data-slot="spinner"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('h-4 w-4 animate-spin', className)}
      {...props}
    />
  )
}

// Named export, shadcn/ui's habit
export { Spinner }
