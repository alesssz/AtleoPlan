/*
 * AtleoPlan's brand, until a real logo exists (docs/01-ui-design.md 1.8,
 * open questions): the mark (a stylised "A" on a lime tile) and the
 * wordmark ("Atleo" + "Plan" in lime). Used by the sidebar and by the
 * phone's top bar (src/components/layout/). The same "A" is the browser
 * tab's icon (public/favicon.svg).
 *
 * Two small components in one file: both export only components, so
 * React's Fast Refresh still works (docs/04-frontend.md 4.4).
 */
import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Props of BrandMark. */
interface BrandMarkProps {
  /** Extra classes, e.g. a size: 'size-8' (default) or 'size-10'. */
  className?: string
}

/**
 * The mark: an SVG (vector drawing, sharp at any size) of a rounded square
 * filled with a lime gradient, with the "A" cut out in the background colour.
 * It is decoration (the name is always written next to it or given to
 * screen readers elsewhere), hence aria-hidden.
 */
export function BrandMark({ className }: BrandMarkProps) {
  // An id unique to this copy of the mark: an SVG gradient is referenced by
  // id (fill="url(#id)"), and two marks on the same page must not share one
  const gradientId = useId()

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      // shrink-0: never squashed by a flex row; rounded-xl + glow-primary:
      // the soft lime halo (src/index.css) follows the tile's rounded shape
      className={cn('size-8 shrink-0 rounded-xl glow-primary', className)}
    >
      <defs>
        {/* The tile's colour: lighter lime at the top-left, deeper at the
            bottom-right, which gives it a little depth */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DBFF6B" />
          <stop offset="1" stopColor="#9FD10F" />
        </linearGradient>
      </defs>
      {/* The tile: 64×64 with corners rounded by 14 */}
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      {/* The "A": its outline and its inner hole in one path, in the dark
          theme's background colour (same drawing as public/favicon.svg) */}
      <path d="M32 12 L50 52 H41 L37.5 43 H26.5 L23 52 H14 Z M29.3 36 H34.7 L32 29 Z" fill="#0B0B0F" />
    </svg>
  )
}

/** Props of Wordmark. */
interface WordmarkProps {
  /** Extra classes, e.g. a text size. */
  className?: string
}

/**
 * The name written as a logo: heavy, tight letters, "Plan" in lime.
 * Not translated: a brand name stays the same in every language.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn('text-lg font-extrabold tracking-tight', className)}>
      Atleo
      <span className="text-primary">Plan</span>
    </span>
  )
}
