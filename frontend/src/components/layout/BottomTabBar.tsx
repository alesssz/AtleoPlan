/*
 * The phone's tab bar, within reach of the thumb. Hidden from 640 px, where
 * SideNav takes over.
 */
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

export function BottomTabBar() {
  const { t } = useTranslation()

  return (
    // Above the iPhone's home indicator
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <ul className="grid grid-cols-5 px-1">
        {NAV_ITEMS.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                // 64 px: a comfortable tap target
                'group flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* The active indicator, styled from the link's aria-current */}
              <span className="flex h-8 w-14 items-center justify-center rounded-full transition-all group-aria-[current=page]:bg-primary/15 group-aria-[current=page]:glow-primary">
                <item.icon aria-hidden="true" className="size-5.5" />
              </span>
              {/* Long German and Spanish labels are truncated */}
              <span className="max-w-full truncate px-1">{t(`nav.${item.labelKey}`)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
