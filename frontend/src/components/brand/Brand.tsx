/*
 * The brand (its files in docs/design/brand/): a heavy italic A with a tick cut
 * out of it, on a lime tile, and the wordmark. The same mark is the favicon
 * (public/favicon.svg).
 */
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
}

/** Decoration: the name is always written next to it or given elsewhere. */
export function BrandMark({ className }: BrandMarkProps) {
  // Two marks on one page must not share a gradient or mask id
  const gradientId = useId()
  const maskId = useId()

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('size-8 shrink-0 rounded-xl glow-primary', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DBFF6B" />
          <stop offset="1" stopColor="#9FD10F" />
        </linearGradient>
        {/* The tick cuts its shape out of the A; the translate re-centres
            the slanted letter */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="0" width="84" height="64">
          <g transform="translate(6 0) skewX(-12)">
            <path d="M27 8 H37 L56 56 H45 L41 46 H23 L19 56 H8 Z" fill="white" />
            <path d="M21.5 37 L29.5 45 L43.5 25.5" fill="none" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </mask>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      {/* The 64 grid shrunk to 44, with a margin of 10 */}
      <g transform="translate(10 10) scale(0.6875)">
        <rect x="-10" width="84" height="64" fill="#0B0B0F" mask={`url(#${maskId})`} />
      </g>
    </svg>
  )
}

interface WordmarkProps {
  className?: string
}

/** Never translated. */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn('text-lg font-extrabold tracking-tight', className)}>
      Atleo
      <span className="text-primary">Plan</span>
    </span>
  )
}
