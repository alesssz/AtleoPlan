/*
 * The frame of the sign-in screens: no navigation, the logo above a card.
 */
import { Outlet } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'

export function AuthLayout() {
  return (
    // Spacing kept modest, so the sign-in form fits a laptop's screen
    // without scrolling
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <BrandMark className="size-10" />
        <Wordmark className="text-2xl" />
      </div>

      <div className="border-glow w-full max-w-md rounded-3xl p-6 sm:p-8">
        <Outlet />
      </div>
    </main>
  )
}
