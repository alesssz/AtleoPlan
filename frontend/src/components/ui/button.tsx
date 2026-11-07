/*
 * Button: shadcn/ui's button, the one every clickable action of the app uses.
 *
 * shadcn/ui is not a package you install: its CLI (`npx shadcn add button`)
 * copies the component's source into src/components/ui/, and from then on
 * the file is ours to read and adapt (configured in components.json). Its
 * components are styled with Tailwind classes and the theme's colour tokens
 * (bg-primary, text-destructive…, defined in src/index.css), and many are
 * built on Radix, a library of unstyled, accessible building blocks
 * (keyboard handling, focus, ARIA attributes). Styles and theme:
 * docs/concepts/C1-frontend.md C1.8.
 *
 * The look is picked with two props, each a set of "variants":
 *   variant: default (filled, primary colour), outline, secondary, ghost
 *            (no background until hovered), destructive (for deleting),
 *            link (looks like a text link);
 *   size:    default, xs, sm, lg, and square icon-only sizes (icon, icon-xs,
 *            icon-sm, icon-lg).
 *   <Button variant="outline" size="sm" onClick={…}>Retry</Button>
 * The variants are defined with cva (class-variance-authority) below.
 */
// `import * as React`: all of React's exports gathered in one object,
// used here for its types (React.ComponentProps)
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
// cn() joins classes and resolves Tailwind conflicts (see src/lib/utils.ts)
import { cn } from 'cn'
import { Slot } from 'radix-ui'

/**
 * The button's classes, by variant. cva(base, { variants, defaultVariants })
 * returns a function: buttonVariants({ variant: 'outline', size: 'sm' })
 * gives the base classes plus those of the chosen variant and size, as one
 * string. Exported so other elements (e.g. a link) can look like a button.
 */
const buttonVariants = cva(
  // Base classes, shared by every variant. In short: an inline row centring
  // icon and text, rounded corners, medium-weight small text that never
  // wraps; a visible ring when focused with the keyboard (focus-visible:);
  // a 1 px press-down on click (active:); half-transparent and unclickable
  // when disabled (disabled:); a red border and ring when the form marks it
  // invalid (aria-invalid:), softer in dark mode (dark:). The `[&_svg]:…`
  // parts are arbitrary variants that style any <svg> icon inside: it never
  // catches clicks, never shrinks, and is 16 px unless it sets its own size-*.
  // group/button names this element so children can react to its state.
  'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  {
    variants: {
      /** The colour scheme. aria-expanded: styles apply while a menu it opens is open. */
      variant: {
        // Filled with the primary colour; slightly lighter on hover (/80 = 80% opacity)
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        // A bordered button on the page background; tinted on hover
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        // A quieter filled button; on hover its colour is mixed with 5% of
        // the text colour (an arbitrary CSS value in [ ])
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        // No background or border until hovered: for toolbars and secondary actions
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        // Red text on a faint red background: for deleting and other risky actions
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        // Looks like a text link, underlined on hover
        link: 'text-primary underline-offset-4 hover:underline',
      },
      /**
       * Height, padding and text size. `has-data-[icon=inline-start]:pl-2`
       * trims the padding on the side of an icon marked data-icon;
       * `in-data-[slot=button-group]:` applies inside a button group; the
       * `rounded-[min(…)]` values cap the corner radius on small buttons.
       */
      size: {
        // 32 px tall
        'default':
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        // 24 px tall, extra-small text and 12 px icons
        'xs': 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        // 28 px tall, 14 px icons
        'sm': 'h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*=\'size-\'])]:size-3.5',
        // 36 px tall
        'lg': 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        // Ours, not shadcn's: 48 px tall, the touch-friendly size of the main
        // actions (tap targets of at least 48 px, docs/design/D1-ui.md D1.5),
        // bold text and 20 px icons. The default (lime) variant also glows a
        // little, through glow-primary (src/index.css), but only while it can
        // be clicked (`not-disabled:`): a disabled button must not look inviting.
        'xl': 'h-12 gap-2 rounded-xl px-6 text-base font-bold data-[variant=default]:not-disabled:glow-primary [&_svg:not([class*=\'size-\'])]:size-5',
        // Square, icon only (32 px); give it an aria-label, it has no text
        'icon': 'size-8',
        // Square icon buttons, 24, 28 and 36 px
        'icon-xs':
          'size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
        // Ours, the square partner of xl: 48 px, for icon-only buttons a
        // finger must hit, such as the plan editor's set and day buttons
        'icon-xl': 'size-12 rounded-xl [&_svg:not([class*=\'size-\'])]:size-5',
      },
    },
    // Used when the prop is not given
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * A button in one of the variants above. Accepts every prop of an HTML
 * <button> (onClick, disabled, type…) plus:
 * - variant, size: the look (see buttonVariants);
 * - asChild: draw the child element instead of a <button>, giving it the
 *   button's classes and props. <Button asChild><Link to="/">…</Link></Button>
 *   gives a real link that looks like a button (src/pages/NotFoundPage.tsx).
 * - className: extra classes, merged last so they win over the variant's.
 *
 * The props type is an intersection (`A & B & C`: all fields of all three):
 * React.ComponentProps<'button'> is every prop of a <button>,
 * VariantProps<typeof buttonVariants> is { variant?, size? } read from the
 * cva definition, and the last part adds asChild.
 * `...props` (the rest) gathers every other prop, passed on below.
 */
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'>
  & VariantProps<typeof buttonVariants> & {
    /** Draw the child element with the button's look instead of a <button>. */
    asChild?: boolean
  }) {
  // The element to draw: Radix's Slot, which merges its props into its one
  // child, or a plain <button>. A capitalised variable, so JSX treats it as
  // a component (<Comp />)
  const Comp = asChild ? Slot.Root : 'button'

  return (
    // data-slot names the part ("button") so parents and CSS can target it
    // (e.g. in-data-[slot=button-group]); data-variant and data-size expose
    // the chosen look the same way. {...props} spreads the remaining props
    // (onClick, disabled, children…) onto the element.
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// Named exports listed at the end, shadcn/ui's habit
export { Button, buttonVariants }
