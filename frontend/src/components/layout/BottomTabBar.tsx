/*
 * The tab bar at the bottom of the screen on phones (narrower than 640 px):
 * the five sections, within reach of the thumb (docs/01-ui-design.md 1.1,
 * principle 1, and 1.7). Hidden from 640 px up, where SideNav takes over.
 * Routing and NavLink: docs/04-frontend.md 4.5; Tailwind: 4.8.
 * Tested in BottomTabBar.test.tsx, next to it.
 */
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

/** The phone navigation: five tabs, the current one highlighted. */
export function BottomTabBar() {
  // t() returns a text in the current language; the component re-renders
  // by itself when the language changes
  const { t } = useTranslation()

  return (
    // Fixed to the bottom edge, full width (inset-x-0), over the content
    // (z-40), with a top border and a slightly see-through background that
    // blurs what scrolls beneath (bg-sidebar/95: 95% opacity; backdrop-blur).
    // pb-[env(…)] is an arbitrary value: bottom padding as tall as the
    // iPhone's home bar, so the tabs stay above it. `sm:hidden` hides the
    // bar from 640 px. aria-label names the navigation for screen readers.
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      {/* Five equal columns, one per tab */}
      <ul className="grid grid-cols-5">
        {/* One tab per section. .map() turns each item into a <li>; `key`
            lets React tell the items apart when the list changes; it must
            be unique among siblings. */}
        {NAV_ITEMS.map(item => (
          <li key={item.to}>
            {/* NavLink is a link that knows whether its route is the
                current one: it then gets aria-current="page", and the
                className function receives isActive to style it.
                Following it changes the screen without reloading the page. */}
            <NavLink
              to={item.to}
              end={item.end}
              // className may be a function: NavLink calls it with an
              // object, destructured here to its isActive field
              className={({ isActive }) => cn(
                // Icon above label (flex column), centred; at least 56 px
                // tall: a comfortable tap target (1.5); colours fade on change
                'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                // Current tab in the primary colour; the others muted,
                // brightening under the mouse (hover:)
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* The icon is decoration: the label below already says it.
                  <item.icon /> draws the component stored in the item */}
              <item.icon aria-hidden="true" className="size-6" />
              {/* Long German or Spanish words are cut with "…", not overflowing (1.7) */}
              <span className="max-w-full truncate px-1">{t(`nav.${item.labelKey}`)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
