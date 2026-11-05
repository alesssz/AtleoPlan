/*
 * Select: shadcn/ui's drop-down picker (the language and theme pickers in
 * Profile: src/components/LanguageSelect.tsx, ThemeSelect.tsx).
 *
 * shadcn/ui copies each component's source into src/components/ui/ (its
 * CLI, configured by components.json), so this file is ours to read. This
 * one is a styled layer over Radix's Select primitive: Radix (the
 * `radix-ui` package) supplies unstyled, accessible building blocks that
 * already handle the hard parts (opening and closing, keyboard arrows and
 * typing to jump, focus, screen-reader roles); shadcn/ui only adds Tailwind
 * classes and a data-slot attribute naming each part. Styles:
 * docs/04-frontend.md 4.8.
 *
 * The parts fit together like this:
 *
 *   <Select value={…} onValueChange={…}>      state: which value is chosen
 *     <SelectTrigger>                          the button that opens it
 *       <SelectValue />                        shows the chosen item's text
 *     </SelectTrigger>
 *     <SelectContent>                          the floating list
 *       <SelectGroup>                          (optional) a titled group
 *         <SelectLabel>…</SelectLabel>
 *         <SelectItem value="it">…</SelectItem>
 *       </SelectGroup>
 *       <SelectSeparator />                    (optional) a dividing line
 *     </SelectContent>
 *   </Select>
 *
 * Used as a controlled component: `value` comes from React, and
 * onValueChange is called with the new value for the app to store.
 *
 * Radix sets data attributes on its elements to describe their state
 * (data-state="open", data-side="bottom", data-disabled, data-placeholder…);
 * the classes below react to them with Tailwind's data-* variants, e.g.
 * `data-[side=bottom]:slide-in-from-top-2`. `data-open:` and `data-closed:`
 * are shortcuts for data-state="open"/"closed" defined by shadcn's CSS
 * (imported in src/index.css).
 */
// All of React's exports in one object; used for its types
import * as React from 'react'
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'
// Radix's Select parts, renamed on import (`as`) so our wrappers can be called Select
import { Select as SelectPrimitive } from 'radix-ui'
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from 'lucide-react'

/**
 * The root: holds the state (the chosen value, open or closed) and draws
 * nothing itself. Takes Radix's Root props: value, defaultValue,
 * onValueChange, open, onOpenChange, disabled, name…
 * `React.ComponentProps<typeof X>` is "the props X accepts", read from X.
 */
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

/** Groups related items (usually with a SelectLabel), with a little padding. */
function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn('scroll-my-1 p-1', className)}
      {...props}
    />
  )
}

/**
 * Inside the trigger: shows the chosen item's text, or `placeholder` when
 * nothing is chosen.
 */
function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/**
 * The button that opens the list: it shows the value (its children) and a
 * chevron. Takes Radix's Trigger props plus `size`: 'default' (32 px tall)
 * or 'sm' (28 px). Callers often pass their own height and width through
 * className (the pickers use h-12, 48 px, for thumbs).
 */
function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** Height: 'default' (32 px) or 'sm' (28 px). */
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      // In short: a bordered, rounded row with the value on the left and the
      // chevron on the right; a ring when focused with the keyboard; dimmed
      // when disabled; red border when invalid; placeholder text muted
      // (data-placeholder:); height by data-size; the value cut to one line
      // (the `*:data-[slot=select-value]:` classes style the SelectValue
      // child); a tinted background in dark mode; icons 16 px by default
      className={cn(
        'flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      {children}
      {/* Radix's icon slot; asChild makes it lend its behaviour to our
          chevron instead of adding its own element */}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/**
 * The floating list of items. Drawn through a Portal: Radix moves it to
 * the end of <body>, so no parent's overflow or stacking can clip it.
 * `position` chooses how it is placed: 'item-aligned' (the default here,
 * like a native picker: the chosen item sits over the trigger) or 'popper'
 * (a drop-down below or above the trigger, `align` sets its alignment).
 */
function SelectContent({
  className,
  children,
  position = 'item-aligned',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      {/* In short: above the page (z-50), no taller than the space Radix
          says is available (--radix-select-content-available-height, a CSS
          variable it sets), scrolling inside; popover colours, rounded,
          shadow and faint ring. Opening and closing fade and zoom
          (data-open:animate-in…, from tw-animate-css) and slide in from
          the trigger's side (data-[side=…]); no animation when aligned on
          the item. As a popper it also keeps a 4 px gap from the trigger */}
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === 'item-aligned'}
        className={cn('relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95', position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', className)}
        position={position}
        align={align}
        {...props}
      >
        {/* Arrows shown when the list is longer than the screen */}
        <SelectScrollUpButton />
        {/* The scrolling area holding the items; as a popper it is at least
            as wide as the trigger (Radix's --radix-select-trigger-width) */}
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            'data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)',
            position === 'popper' && '',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/** A group's title: small, muted, not selectable. */
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * One choice. `value` is what onValueChange receives; the children are its
 * visible text (and what SelectValue shows once chosen). A check mark
 * appears on the chosen one.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    // In short: a full-width row with room on the right for the check mark;
    // highlighted when reached with the mouse or arrows (focus:); dimmed and
    // unclickable when disabled (data-disabled:); icons 16 px by default
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      {/* The check mark, pinned to the right; ItemIndicator draws its
          content only on the chosen item */}
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {/* The text Radix copies into SelectValue when this item is chosen */}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

/** A thin horizontal line between groups of items. */
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

/** The arrow at the top of a long list; Radix shows it only when there is more above. */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )
}

/** The arrow at the bottom of a long list; shown only when there is more below. */
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*=\'size-\'])]:size-4',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )
}

// Named exports listed at the end, shadcn/ui's habit
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
