/*
 * The frame of the sign-in screens: full screen, no navigation, the logo above a
 * card. In the route table (src/router.tsx) it is the parent of those pages, and
 * React Router draws the current one where <Outlet /> is. Routing:
 * docs/concepts/C1-frontend.md C1.5; the screens: docs/design/D1-ui.md D1.4.1.
 */
import { Outlet } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'

/** The logo and a centred card, on the page's usual glowing background. */
export function AuthLayout() {
  return (
    // A column centred both ways over the full screen height (dvh follows the
    // phone's browser bars). The padding keeps clear of the notch and home bar
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* The logo, larger than in the app's frame: here it is the only branding */}
      <div className="flex items-center gap-3">
        <BrandMark className="size-10" />
        <Wordmark className="text-2xl" />
      </div>

      {/* The card, at most 28rem wide. The page draws its own title and form */}
      <div className="border-glow w-full max-w-md rounded-3xl p-6 sm:p-8">
        <Outlet />
      </div>
    </main>
  )
}
