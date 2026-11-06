/*
 * The tab bar at the bottom of the screen on phones (narrower than 640 px):
 * the five sections, within reach of the thumb (docs/design/D1-ui.md D1.1,
 * principle 1, and D1.7). Hidden from 640 px up, where SideNav takes over.
 * Routing and NavLink: docs/concepts/C1-frontend.md C1.5; Tailwind: C1.8; the visual
 * style (the lime "pill" behind the current tab): D1.5 "Visual style".
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
    // (z-40), with a top border and a see-through background that blurs what
    // scrolls beneath it (bg-sidebar/80: 80% opacity; backdrop-blur-xl).
    // pb-[env(…)] is an arbitrary value: bottom padding as tall as the
    // iPhone's home bar, so the tabs stay above it. `sm:hidden` hides the
    // bar from 640 px. aria-label names the navigation for screen readers.
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      {/* Five equal columns, one per tab */}
      <ul className="grid grid-cols-5 px-1">
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
              // object, destructured here to its isActive field.
              // `group` lets the children react to this link's state:
              // a child with `group-aria-[current=page]:` classes changes
              // when the link is the current page (see the pill below).
              className={({ isActive }) => cn(
                // Icon above label (flex column), centred; at least 64 px
                // tall: a comfortable tap target (D1.5); colours fade on change
                'group flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                // Current tab's label in lime; the others muted
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* The "pill" around the icon: on the current tab it fills with
                  a lime tint and glows, the Material-style active indicator.
                  The styles come from the parent link's aria-current, set by
                  NavLink, through `group-aria-[current=page]:` */}
              <span className="flex h-8 w-14 items-center justify-center rounded-full transition-all group-aria-[current=page]:bg-primary/15 group-aria-[current=page]:glow-primary">
                {/* The icon is decoration: the label below already says it.
                    <item.icon /> draws the component stored in the item */}
                <item.icon aria-hidden="true" className="size-5.5" />
              </span>
              {/* Long German or Spanish words are cut with "…", not overflowing (D1.7) */}
              <span className="max-w-full truncate px-1">{t(`nav.${item.labelKey}`)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
