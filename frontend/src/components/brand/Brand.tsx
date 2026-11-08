/*
 * AtleoPlan's brand (docs/design/D1-ui.md D1.5, "Brand"): the mark, a heavy
 * italic A with a tick cut out of it, on a lime tile; and the wordmark,
 * "Atleo" + "Plan" in lime. The A is the name's initial, the tick the app's
 * own gesture (a set done, one tap), the slant forward the movement. Used by
 * the sidebar, the phone's top bar and the sign-in screens
 * (src/components/layout/).
 *
 * The same mark is the browser tab's icon (public/favicon.svg), lime on the
 * dark background: one mark everywhere. The drawings, at full size:
 * docs/design/brand/.
 *
 * Two small components in one file: both export only components, so
 * React's Fast Refresh still works (docs/concepts/C1-frontend.md C1.4).
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
 * filled with a lime gradient, and on it the A in the dark background colour,
 * with the tick cut out of it. It is decoration (the name is always written
 * next to it or given to screen readers elsewhere), hence aria-hidden.
 */
export function BrandMark({ className }: BrandMarkProps) {
  // Ids unique to this copy of the mark: an SVG gradient or mask is
  // referenced by id (fill="url(#id)"), and two marks on the same page must
  // not share one
  const gradientId = useId()
  const maskId = useId()

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
        {/* The A and its tick, as a mask: what is white in it shows, what
            is black is cut away. The A, a filled letter, is white; the tick,
            a thick black line over it, cuts its shape out of the A.
            skewX(-12) slants both forward, as italic letters;
            translate(6 0) brings the slanted A back to the middle */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="0" width="84" height="64">
          <g transform="translate(6 0) skewX(-12)">
            <path d="M27 8 H37 L56 56 H45 L41 46 H23 L19 56 H8 Z" fill="white" />
            <path d="M21.5 37 L29.5 45 L43.5 25.5" fill="none" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </mask>
      </defs>
      {/* The tile: 64×64 with corners rounded by 14 */}
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      {/* The mark, drawn on its own 64 × 64 grid and shrunk into the tile
          with a margin of 10: translate moves it, scale(0.6875) makes 64
          into 44. A dark rectangle seen through the mask: only the A, less
          the tick, shows (same drawing as public/favicon.svg) */}
      <g transform="translate(10 10) scale(0.6875)">
        <rect x="-10" width="84" height="64" fill="#0B0B0F" mask={`url(#${maskId})`} />
      </g>
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
