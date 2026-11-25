import { describe, expect, it } from 'vitest'
import { ApiError } from './http'
import { shownData } from './shown-data'

describe('shownData', () => {
  it('keeps the last answer when the server could not answer', () => {
    expect(shownData({ data: 'plan', error: new ApiError(0, 'Network error') })).toBe('plan')
    expect(shownData({ data: 'plan', error: new ApiError(502, 'Bad Gateway') })).toBe('plan')
  })

  it('keeps it when the server said only "not now"', () => {
    expect(shownData({ data: 'plan', error: new ApiError(429, 'Too Many Attempts.') })).toBe('plan')
  })

  it('drops it when the server said it is gone or not yours', () => {
    expect(shownData({ data: 'plan', error: new ApiError(404, 'Not Found') })).toBeUndefined()
    expect(shownData({ data: 'plan', error: new ApiError(403, 'Forbidden') })).toBeUndefined()
  })

  it('gives the answer as it is when nothing failed', () => {
    expect(shownData({ data: 'plan', error: null })).toBe('plan')
    expect(shownData({ data: undefined, error: null })).toBeUndefined()
  })
})
