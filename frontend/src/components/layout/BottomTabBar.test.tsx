/*
 * The phone's tab bar: five tabs, the current one marked, labels in the
 * user's language.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { BottomTabBar } from './BottomTabBar'

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
    const links = screen.getAllByRole('link')
    expect(links.map(link => link.textContent)).toEqual(['Home', 'Plans', 'Exercises', 'Progress', 'Profile'])
  })

  it('marks the current section', () => {
    renderAt('/plans')
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('aria-current', 'page')
    // Although every address starts with '/'
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('speaks the user’s language', async () => {
    await i18n.changeLanguage('it')
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Schede' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigazione principale' })).toBeInTheDocument()
  })
})
