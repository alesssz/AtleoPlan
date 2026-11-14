/*
 * The frame of every signed-in screen: SideNav from 640 px, BottomTabBar below,
 * and the logo on top on phones. Workout mode lives outside it, full screen.
 */
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'
import { BottomTabBar } from './BottomTabBar'
import { SideNav } from './SideNav'

export function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t('nav.skipToContent')}
      </a>

      <SideNav />

      {/* Clear of the notch at the top and, on phones, of the tab bar and
          the home indicator at the bottom */}
      <main
        id="main"
        className="min-w-0 flex-1 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-10 sm:pb-12 lg:px-12"
      >
        <div className="mx-auto w-full max-w-5xl">
          {/* On phones the sidebar, which carries the logo, is hidden */}
          <div className="mb-6 flex items-center gap-2.5 sm:hidden">
            <BrandMark className="size-7" />
            <Wordmark className="text-base" />
          </div>

          {/* Keyed by the path, so the entrance animation replays on every
              page change (skipped for reduced motion) */}
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
            <Outlet />
          </div>
        </div>
      </main>

      <BottomTabBar />

      <ScrollRestoration />
    </div>
  )
}
