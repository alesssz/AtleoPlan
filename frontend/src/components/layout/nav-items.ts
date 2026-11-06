/*
 * The five main sections of the app (docs/design/D1-ui.md D1.3), in the
 * order they appear. One list feeds both navigations: the tab bar at the
 * bottom on phones (BottomTabBar) and the sidebar on wider screens
 * (SideNav), so the two can never disagree. Routing: docs/concepts/C1-frontend.md C1.5.
 *
 * A .ts file, not .tsx: it holds data, no JSX.
 */
// `type LucideIcon` inside the braces imports only a type (the type of any
// lucide icon component); the other names are the icon components
import { ClipboardList, Dumbbell, House, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'

/** One entry of the main navigation. */
export interface NavItem {
  /** The route it opens (src/router.tsx). */
  to: string
  /**
   * Its label: the key under `nav` in the translation files ('home' → t('nav.home')).
   * A union of the allowed names, so a typo is a type error.
   */
  labelKey: 'home' | 'plans' | 'exercises' | 'progress' | 'profile'
  /** Its icon, a component from lucide-react. */
  icon: LucideIcon
  /**
   * Active only on an exact match. Needed for Home ('/'): every address
   * starts with '/', so without it Home would always look active.
   */
  end?: boolean
}

/**
 * The entries, in display order. `readonly NavItem[]` is an array of
 * NavItem that code cannot change (no push, no reassigning items).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'home', icon: House, end: true },
  { to: '/plans', labelKey: 'plans', icon: ClipboardList },
  { to: '/exercises', labelKey: 'exercises', icon: Dumbbell },
  { to: '/progress', labelKey: 'progress', icon: TrendingUp },
  { to: '/profile', labelKey: 'profile', icon: UserRound },
]
