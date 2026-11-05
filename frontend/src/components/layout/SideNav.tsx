/*
 * The sidebar on tablets and desktops (docs/01-ui-design.md 1.7):
 * - 640–1024 px: compact, icons only (each with an accessible name and a
 *   tooltip, as icon-only controls must have: docs/03-conventions.md 3.2);
 * - from 1024 px: wider, with the labels next to the icons.
 * Hidden on phones, where BottomTabBar takes over.
 *
 * The widths are switched by Tailwind's responsive prefixes: a class with
 * `sm:` applies from 640 px up, with `lg:` from 1024 px up, and a class
 * without a prefix at every width (docs/04-frontend.md 4.8). Routing and
 * NavLink: 4.5.
 */
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

/** The tablet and desktop navigation: logo, then one link per section. */
export function SideNav() {
  // The translate function, taken out of useTranslation()'s result
  // (destructuring); the component re-renders when the language changes
  const { t } = useTranslation()

  return (
    // `hidden sm:flex`: not drawn on phones, a column from 640 px.
    // sticky + top-0 + h-dvh: as tall as the screen, stays in place while
    // the page scrolls. 64 px wide from 640 px (sm:w-16), 224 px from
    // 1024 px (lg:w-56); a right border and the sidebar's colours.
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex sm:w-16 lg:w-56">
      {/* Brand: the "A" alone when compact, the full name when wide */}
      <div className="flex h-16 items-center gap-2 px-4 lg:px-5">
        {/* A 32 px rounded square in the primary colour, the letter centred
            (grid + place-items-center) */}
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
          A
        </span>
        {/* sr-only hides it on screen but leaves it for screen readers;
            lg:not-sr-only shows it from 1024 px */}
        <span className="sr-only font-semibold lg:not-sr-only">{t('app.name')}</span>
      </div>

      {/* The links: take the remaining height (flex-1) */}
      <nav aria-label={t('nav.label')} className="flex-1 px-2 py-2 lg:px-3">
        {/* A column of links, 4 px apart */}
        <ul className="flex flex-col gap-1">
          {/* One link per section; the arrow function has a body (braces)
              to compute `label` first, so it ends with `return` */}
          {NAV_ITEMS.map((item) => {
            // The label, used as the visible text, the screen-reader name and the tooltip
            const label = t(`nav.${item.labelKey}`)
            return (
              <li key={item.to}>
                {/* NavLink knows whether its route is current: isActive */}
                <NavLink
                  to={item.to}
                  end={item.end}
                  // The browser's own tooltip, useful when only the icon shows
                  title={label}
                  className={({ isActive }) => cn(
                    // 48 px tall: the minimum tap target (1.5); centred icon
                    // when compact, left-aligned with its label from 1024 px
                    'flex h-12 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start',
                    // Current link on a highlighted background; the others
                    // muted, highlighted under the mouse
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon aria-hidden="true" className="size-5 shrink-0" />
                  {/* Hidden on screen when compact, still read by screen
                      readers; shown from 1024 px */}
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
