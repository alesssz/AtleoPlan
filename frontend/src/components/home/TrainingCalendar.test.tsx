import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { CalendarSession } from '@/api/sessions'
import { fakeApi, renderRoutes, signedInAs, type FakeAnswer } from '@/test/auth-helpers'
import { TrainingCalendar } from './TrainingCalendar'

/** Thursday 19 November 2026, 18:00 on the device. */
const TODAY = new Date(2026, 10, 19, 18, 0)

/** A finished workout at a local moment. Months from 1. */
function workout(id: string, month: number, day: number, minutes = 45): CalendarSession {
  return { id, started_at: new Date(2026, month - 1, day, 18).toISOString(), duration_seconds: minutes * 60 }
}

/** GET /api/sessions/calendar's answer. */
function calendarAnswer(sessions: CalendarSession[]): FakeAnswer {
  return { status: 200, body: { data: sessions } }
}

/** The calendar on its own, with history's route for the days' links. */
function renderCalendar(recent: CalendarSession[], answers: Record<string, FakeAnswer | 'network'> = {}) {
  const fake = fakeApi({ 'GET /api/user': signedInAs(), ...answers })
  const routes = [
    { path: '/', element: <TrainingCalendar recent={recent} today={TODAY} /> },
    { path: 'progress/history', element: <p>history</p> },
  ]
  return { fake, ...renderRoutes(routes, '/') }
}

/** The paths asked of the calendar's endpoint. */
function calendarCalls(fake: ReturnType<typeof fakeApi>): string[] {
  return fake.mock.calls.map(([path]) => path).filter(path => path.startsWith('/api/sessions/calendar'))
}

/** The query of a span between two local midnights. Months from 1. */
function spanQuery(from: [number, number, number], to: [number, number, number]): string {
  const moment = ([year, month, day]: [number, number, number]) => encodeURIComponent(new Date(year, month - 1, day).toISOString())
  return `/api/sessions/calendar?from=${moment(from)}&to=${moment(to)}`
}

describe('TrainingCalendar', () => {
  it('opens on this month from Home\'s workouts, as a table of weeks, asking nothing more', async () => {
    const { fake } = renderCalendar([workout('a', 11, 2, 50), workout('b', 11, 19), workout('c', 11, 19, 15)])

    const card = await screen.findByRole('region', { name: 'November 2026' })
    expect(within(card).getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true')
    const month = within(card).getByRole('table')
    expect(within(month).getAllByRole('columnheader').map(header => header.textContent)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(within(month).getByRole('link', { name: 'Monday, November 2: 1 workout' })).toHaveAttribute('href', '/progress/history?from=2026-11-02&to=2026-11-02')
    expect(within(month).getByRole('link', { name: 'Thursday, November 19: 2 workouts' })).toHaveAttribute('aria-current', 'date')
    // How many and how long, in a line: 50 + 45 + 15 minutes
    expect(within(card).getByText('3 workouts')).toHaveTextContent('3 workouts · 1 hr 50 min')
    // Nothing ahead of today, and nothing asked
    expect(within(card).getByRole('button', { name: 'Next month' })).toBeDisabled()
    expect(calendarCalls(fake)).toEqual([])
  })

  it('encourages a first workout in an empty month', async () => {
    renderCalendar([])

    expect(await screen.findByText('No workouts yet this month. The first one is the one that counts.')).toBeInTheDocument()
  })

  it('shows this week from Home\'s workouts too, each day trained a link to it', async () => {
    const { fake } = renderCalendar([workout('a', 11, 17), workout('b', 11, 19, 60), workout('c', 11, 19, 15)])

    await userEvent.click(await screen.findByRole('tab', { name: 'Week' }))

    const card = await screen.findByRole('region', { name: 'This week' })
    expect(within(card).getByRole('link', { name: 'Tuesday, November 17: 1 workout' })).toHaveAttribute('href', '/progress/history?from=2026-11-17&to=2026-11-17')
    expect(within(card).getByRole('link', { name: 'Thursday, November 19: 2 workouts' })).toHaveAttribute('aria-current', 'date')
    // 45 + 60 + 15 minutes
    expect(within(card).getByText('3 workouts')).toHaveTextContent('3 workouts · 2 hr')
    expect(within(card).getByRole('button', { name: 'Next week' })).toBeDisabled()
    expect(calendarCalls(fake)).toEqual([])
  })

  it('goes back a week through the server, and comes back with Today', async () => {
    const { fake } = renderCalendar([], { 'GET /api/sessions/calendar': calendarAnswer([workout('old', 11, 11)]) })

    await userEvent.click(await screen.findByRole('tab', { name: 'Week' }))
    await userEvent.click(screen.getByRole('button', { name: 'Previous week' }))

    // Intl puts thin spaces around the dash
    const card = await screen.findByRole('region', { name: /^Nov 9\s–\s15, 2026$/ })
    expect(await within(card).findByRole('link', { name: 'Wednesday, November 11: 1 workout' })).toBeInTheDocument()
    expect(calendarCalls(fake)).toEqual([spanQuery([2026, 11, 9], [2026, 11, 16])])
    expect(within(card).getByRole('button', { name: 'Next week' })).toBeEnabled()

    await userEvent.click(within(card).getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('region', { name: 'This week' })).toBeInTheDocument()
  })

  it('goes back a month through the server, counting once a workout in both answers', async () => {
    // 25 October is in Home's 32 days and in October's answer
    const { fake } = renderCalendar([workout('b', 10, 25), workout('c', 11, 19)], { 'GET /api/sessions/calendar': calendarAnswer([workout('a', 10, 2, 50), workout('b', 10, 25)]) })

    await userEvent.click(await screen.findByRole('button', { name: 'Previous month' }))

    const card = await screen.findByRole('region', { name: 'October 2026' })
    expect(await within(card).findByRole('link', { name: 'Friday, October 2: 1 workout' })).toBeInTheDocument()
    expect(within(card).getByText('2 workouts')).toHaveTextContent('2 workouts · 1 hr 35 min')
    expect(calendarCalls(fake)).toEqual([spanQuery([2026, 10, 1], [2026, 11, 1])])
  })

  it('shows a year as twelve months, each opening as a month, those ahead disabled', async () => {
    renderCalendar([], { 'GET /api/sessions/calendar': calendarAnswer([workout('a', 3, 4), workout('b', 3, 6), workout('c', 11, 2)]) })

    await userEvent.click(await screen.findByRole('tab', { name: 'Year' }))

    const card = await screen.findByRole('region', { name: '2026' })
    const march = await within(card).findByRole('button', { name: 'March 2026: 2 workouts' })
    expect(within(card).getByRole('button', { name: 'December 2026: 0 workouts' })).toBeDisabled()
    expect(within(card).getByRole('button', { name: 'Next year' })).toBeDisabled()

    await userEvent.click(march)
    expect(await screen.findByRole('region', { name: 'March 2026' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true')
  })

  it('says so when another span cannot be read, with a way to try again', async () => {
    renderCalendar([], { 'GET /api/sessions/calendar': { status: 500, body: { message: 'Server Error' } } })

    await userEvent.click(await screen.findByRole('button', { name: 'Previous month' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The calendar could not be loaded.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
