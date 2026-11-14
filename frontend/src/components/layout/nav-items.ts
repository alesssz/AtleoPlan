/*
 * The five sections, in display order. One list for both navigations, so they
 * never disagree.
 */
import { ClipboardList, Dumbbell, House, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  /** The key under `nav` in the translation files. */
  labelKey: 'home' | 'plans' | 'exercises' | 'progress' | 'profile'
  icon: LucideIcon
  /** For Home: every path starts with '/', so it would always look active. */
  end?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'home', icon: House, end: true },
  { to: '/plans', labelKey: 'plans', icon: ClipboardList },
  { to: '/exercises', labelKey: 'exercises', icon: Dumbbell },
  { to: '/progress', labelKey: 'progress', icon: TrendingUp },
  { to: '/profile', labelKey: 'profile', icon: UserRound },
]
