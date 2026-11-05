/*
 * The phone's tab bar: five tabs, the current one marked, labels in the
 * user's language. Also the model of a component test: render, then look
 * at the page the way a user would (by role and visible text, not by CSS
 * class). docs/04-frontend.md 4.10.
 *
 * The tools:
 * - Vitest gives describe() (a group of tests), it() (one test) and
 *   expect(value).matcher() (a check that fails the test when wrong);
 * - Testing Library's render() draws a component into a simulated page
 *   (jsdom, set in vite.config.ts), and `screen` searches that page;
 * - screen.getByRole('link', { name: 'Plans' }) finds the one element
 *   with that accessibility role (a link) and accessible name (its text
 *   or aria-label), and fails if there is none or more than one;
 *   getAllByRole() returns every match.
 * Matchers like toHaveAttribute() come from jest-dom (src/test/setup.ts).
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { BottomTabBar } from './BottomTabBar'

/**
 * Renders the tab bar as if the browser were at `path`. MemoryRouter is a
 * router that keeps the address in memory instead of the address bar:
 * NavLink needs a router around it.
 * @param path the address to start at, e.g. '/plans'
 * @returns Testing Library's render result (unused: tests read `screen`)
 */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomTabBar />
    </MemoryRouter>,
  )
}

describe('BottomTabBar', () => {
  it('shows the five sections', () => {
    renderAt('/')
    // Every link inside the navigation landmark
    const links = screen.getAllByRole('link')
    // .map() makes the list of their texts; toEqual compares the contents
    expect(links.map(link => link.textContent)).toEqual(['Home', 'Plans', 'Exercises', 'Progress', 'Profile'])
  })

  it('marks the current section', () => {
    renderAt('/plans')
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('aria-current', 'page')
    // Home is not current on /plans, although every address starts with '/'.
    // `.not` turns any matcher into its opposite
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  // async: the test awaits the language switch (a Promise) before rendering
  it('speaks the user’s language', async () => {
    await i18n.changeLanguage('it')
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Schede' })).toBeInTheDocument()
    // The <nav> has the role "navigation"; its name is its aria-label
    expect(screen.getByRole('navigation', { name: 'Navigazione principale' })).toBeInTheDocument()
  })
})
