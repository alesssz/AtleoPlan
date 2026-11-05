/*
 * The frame around every signed-in screen: the navigation (SideNav or
 * BottomTabBar, depending on the width) and the space where the current
 * page is drawn. In the route table (src/router.tsx) it is the parent of
 * the pages; React Router draws the matching page where <Outlet /> is.
 * Workout mode will live outside this frame, full screen
 * (docs/01-ui-design.md 1.3). Routing: docs/04-frontend.md 4.5; the
 * responsive layout and Tailwind: 4.8.
 *
 * Both navigations are always in the page; Tailwind's responsive classes
 * show one and hide the other depending on the screen width.
 */
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router'
import { BottomTabBar } from './BottomTabBar'
import { SideNav } from './SideNav'

/** The app's frame: skip link, side navigation, page, tab bar. */
export function AppLayout() {
  // useTranslation() is react-i18next's hook; `const { t } = …` takes the
  // translate function t out of the object it returns (destructuring)
  const { t } = useTranslation()

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
          least 1.5rem or the phone's notch area, whichever is larger
          (env(safe-area-inset-top)); bottom padding on phones leaves room
          for the tab bar (56 px plus the iPhone's home bar); from 640 px
          there is no tab bar, so less. */}
      <main
        id="main"
        className="min-w-0 flex-1 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-10 lg:px-10"
      >
        {/* Centred column, at most 64rem (1024 px) wide on large screens */}
        <div className="mx-auto w-full max-w-5xl">
          {/* The current page, chosen by the router */}
          <Outlet />
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
