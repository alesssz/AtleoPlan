/*
 * The frame around every signed-in screen: the navigation (SideNav or
 * BottomTabBar, depending on the width), the logo at the top on phones, and
 * the space where the current page is drawn. In the route table
 * (src/router.tsx) it is the parent of the pages; React Router draws the
 * matching page where <Outlet /> is. Workout mode will live outside this
 * frame, full screen (docs/design/D1-ui.md D1.3). Routing:
 * docs/concepts/C1-frontend.md C1.5; the responsive layout and Tailwind: C1.8.
 *
 * Both navigations are always in the page; Tailwind's responsive classes
 * show one and hide the other depending on the screen width.
 */
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'
import { BottomTabBar } from './BottomTabBar'
import { SideNav } from './SideNav'

/** The app's frame: skip link, side navigation, page, tab bar. */
export function AppLayout() {
  const { t } = useTranslation()
  // The current address (React Router's hook): its `pathname` ('/plans')
  // changes on every page change, which restarts the page's entrance below
  const location = useLocation()

  return (
    // A row (flex): sidebar on the left, page on the right.
    // min-h-dvh: at least the full height of the screen; "dvh" follows the
    // phone's browser bars as they appear and disappear, unlike "vh"
    <div className="flex min-h-dvh">
      {/* Skip link: keyboard users can jump straight past the navigation.
          sr-only hides it; the `focus:` classes apply only while it has
          the keyboard focus (Tab), and then show it as a small coloured
          button pinned top-left, above everything (z-50) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t('nav.skipToContent')}
      </a>

      {/* Navigation for tablets and desktops (hidden on phones) */}
      <SideNav />

      {/* The page. flex-1 takes the remaining width (min-w-0 lets it shrink
          below its content's width instead of overflowing). Side padding
          grows with the screen (sm:, lg:). The values in square brackets
          are Tailwind's arbitrary values, raw CSS: the top padding is at
          least 1rem or the phone's notch area, whichever is larger
          (env(safe-area-inset-top)); bottom padding on phones leaves room
          for the tab bar (64 px plus the iPhone's home bar); from 640 px
          there is no tab bar, so less. */}
      <main
        id="main"
        className="min-w-0 flex-1 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-10 sm:pb-12 lg:px-12"
      >
        {/* Centred column, at most 64rem (1024 px) wide on large screens */}
        <div className="mx-auto w-full max-w-5xl">
          {/* Phones only (sm:hidden): the logo at the top, since the
              sidebar that carries it on wider screens is hidden */}
          <div className="mb-6 flex items-center gap-2.5 sm:hidden">
            <BrandMark className="size-7" />
            <Wordmark className="text-base" />
          </div>

          {/* The current page, chosen by the router. `key` is special: when
              it changes, React throws the element away and creates a new one,
              so the entrance animation runs again on every page change.
              animate-in fade-in slide-in-from-bottom-2 (from tw-animate-css):
              fade in while rising 8 px, in 300 ms. motion-reduce:animate-none
              skips it for users who asked their device for less motion
              (docs/design/D1-ui.md D1.7). */}
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Navigation for phones (hidden from 640 px) */}
      <BottomTabBar />

      {/* Opening a new page starts at its top; going back returns to where
          you were (React Router remembers the scroll positions). Draws nothing */}
      <ScrollRestoration />
    </div>
  )
}
