/*
 * The Button's `pending` prop, ours (src/components/ui/button.tsx,
 * docs/concepts/C1-frontend.md C1.20): a button whose request runs cannot be
 * pressed again, shows a spinner and says it is busy; with asChild it
 * still draws its one child.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('is disabled, busy and shows a spinner while pending', () => {
    render(<Button pending>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    // The spinner, found by its data-slot: it is hidden from screen readers
    expect(button.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
  })

  it('has no spinner and no aria-busy when not pending', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeEnabled()
    expect(button).not.toHaveAttribute('aria-busy')
    expect(button.querySelector('[data-slot="spinner"]')).not.toBeInTheDocument()
  })

  it('still draws its one child with asChild', () => {
    render(<Button asChild><a href="/plans">Plans</a></Button>)

    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('href', '/plans')
  })
})
