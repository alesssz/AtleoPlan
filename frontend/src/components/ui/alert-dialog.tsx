/*
 * AlertDialog: shadcn/ui's confirmation dialog, built on Radix UI's
 * AlertDialog, for an action that cannot be undone, such as deleting an
 * exercise. Added with `npx shadcn add alert-dialog` (answering "no" when it
 * offered to overwrite button.tsx, which has our own sizes); what shadcn/ui
 * and Radix are: select.tsx and docs/concepts/C1-frontend.md C1.8.
 *
 * Radix does the hard parts: the dialog is drawn in a "portal" (at the end of
 * <body>, above everything), the keyboard focus moves into it and stays there,
 * Escape closes it, and screen readers announce its title and description. A
 * family of parts:
 *
 *   <AlertDialog>
 *     <AlertDialogTrigger asChild><Button>Delete</Button></AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>Delete this exercise?</AlertDialogTitle>
 *         <AlertDialogDescription>…</AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Cancel</AlertDialogCancel>
 *         <AlertDialogAction onClick={…}>Delete</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 *
 * Unlike a plain dialog, clicking outside does not close it: the user must
 * choose. The data-open / data-closed attributes set by Radix drive the fade
 * and zoom animations (tw-animate-css).
 */
// React's types; cn() joins classes; Radix's AlertDialog; our Button, for
// the two actions, and our Spinner, for an action whose request runs
import * as React from 'react'
import { cn } from 'cn'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

/** The root: holds whether the dialog is open. Controlled with `open` and `onOpenChange`, or left to the trigger. */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

/** What opens the dialog; with `asChild`, its child (a Button) does. */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

/** Draws its children at the end of <body>, above the page. */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

/** The dimmed, slightly blurred layer behind the dialog. */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

/** The dialog's box, centred, with the overlay behind it. `size` 'sm' makes the footer's buttons share one row. */
function AlertDialogContent({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: 'default' | 'sm'
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          'group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/** The column holding the title and the description. */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
        className,
      )}
      {...props}
    />
  )
}

/** The row of buttons: stacked on phones, side by side from 640 px. */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

/** An optional icon or picture above the title. */
function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        'mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*=size-])]:size-6',
        className,
      )}
      {...props}
    />
  )
}

/** The question, read first by screen readers. */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'font-heading text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
        className,
      )}
      {...props}
    />
  )
}

/** The sentence under the title, saying what will happen. */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        'text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

/**
 * The button that confirms: a Button (variant and size of button.tsx) acting
 * as Radix's Action, which also closes the dialog. Ours, not shadcn's:
 * `pending`, as on Button, for an action that keeps the dialog open while
 * its request runs (Delete, with preventDefault()). Button cannot add the
 * spinner itself here (it draws its child through asChild), so it is put
 * inside the Action, before the text.
 */
function AlertDialogAction({
  className,
  variant = 'default',
  size = 'default',
  pending = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>
  // Pick<T, keys>: only these props of Button's, with their types
  & Pick<React.ComponentProps<typeof Button>, 'variant' | 'size' | 'pending'>) {
  return (
    // As in Button: disabled while pending, aria-busy for screen readers
    // (and for Button's class that hides the icons), the spinner first
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        disabled={pending || disabled}
        aria-busy={pending || undefined}
        {...props}
      >
        {pending && <Spinner />}
        {children}
      </AlertDialogPrimitive.Action>
    </Button>
  )
}

/** The button that closes the dialog without doing anything; outlined by default. */
function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>
  & Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
