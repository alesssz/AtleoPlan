/*
 * The sidebar from 640 px: icons only up to 1024 px, each with an accessible
 * name and a tooltip; labels and the logo's name above.
 */
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

export function SideNav() {
  const { t } = useTranslation()

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 text-sidebar-foreground backdrop-blur-xl sm:flex sm:w-18 lg:w-60">
      <div className="flex h-20 items-center justify-center gap-3 px-4 lg:justify-start lg:px-6">
        <BrandMark className="size-9" />
        <Wordmark className="sr-only lg:not-sr-only" />
      </div>

      <nav aria-label={t('nav.label')} className="flex-1 px-3 py-2 lg:px-4">
        <ul className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const label = t(`nav.${item.labelKey}`)
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  // The tooltip, for when only the icon shows
                  title={label}
                  className={({ isActive }) => cn(
                    'relative flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all lg:justify-start',
                    // The active link gets a glowing bar on the left edge
                    isActive
                      ? 'bg-primary/12 text-primary before:absolute before:inset-y-2.5 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary before:shadow-[0_0_12px_var(--primary)] lg:before:-left-4'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="sr-only lg:not-sr-only">{label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
