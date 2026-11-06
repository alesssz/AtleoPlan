/*
 * The sidebar on tablets and desktops (docs/design/D1-ui.md D1.7):
 * - 640–1024 px: compact, icons only (each with an accessible name and a
 *   tooltip, as icon-only controls must have: docs/project/P1-conventions.md P1.2);
 * - from 1024 px: wider, with the logo's name and the labels.
 * Hidden on phones, where BottomTabBar takes over.
 *
 * The widths are switched by Tailwind's responsive prefixes: a class with
 * `sm:` applies from 640 px up, with `lg:` from 1024 px up, and a class
 * without a prefix at every width (docs/concepts/C1-frontend.md C1.8). Routing and
 * NavLink: C1.5. The visual style (lime indicator, glow): D1.5 "Visual style".
 */
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { BrandMark, Wordmark } from '@/components/brand/Brand'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

/** The tablet and desktop navigation: logo, then one link per section. */
export function SideNav() {
  const { t } = useTranslation()

  return (
    // `hidden sm:flex`: not drawn on phones, a column from 640 px.
    // sticky + top-0 + h-dvh: as tall as the screen, stays in place while
    // the page scrolls. 72 px wide from 640 px (sm:w-18), 240 px from 1024 px
    // (lg:w-60). The background is the sidebar colour at 70% (`/70`) with a
    // blur of what is behind it (the page's glow), and a right border.
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 text-sidebar-foreground backdrop-blur-xl sm:flex sm:w-18 lg:w-60">
      {/* Brand: the mark alone when compact, mark + name when wide.
          The name is hidden visually (sr-only) when compact but still read
          by screen readers; lg:not-sr-only shows it from 1024 px */}
      <div className="flex h-20 items-center justify-center gap-3 px-4 lg:justify-start lg:px-6">
        <BrandMark className="size-9" />
        <Wordmark className="sr-only lg:not-sr-only" />
      </div>

      {/* The links: take the remaining height (flex-1) */}
      <nav aria-label={t('nav.label')} className="flex-1 px-3 py-2 lg:px-4">
        {/* A column of links, 6 px apart */}
        <ul className="flex flex-col gap-1.5">
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
                    // 48 px tall: the minimum tap target (D1.5); the icon
                    // centred when compact, left-aligned with its label from
                    // 1024 px. `relative` lets the indicator below be placed
                    // against this link's edges.
                    'relative flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all lg:justify-start',
                    // Current link: lime text on a faint lime tint (primary
                    // at 12%), plus the indicator: a pseudo-element
                    // (`before:`, an extra box CSS draws before the content)
                    // shaped as a 4 px lime bar on the left edge, glowing.
                    // Other links: muted, tinted under the mouse (hover:).
                    isActive
                      ? 'bg-primary/12 text-primary before:absolute before:inset-y-2.5 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary before:shadow-[0_0_12px_var(--primary)] lg:before:-left-4'
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
