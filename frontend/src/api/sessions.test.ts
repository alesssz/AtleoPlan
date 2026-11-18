import { describe, expect, it } from 'vitest'
import { lastSetsQuery } from './sessions'

describe('lastSetsQuery', () => {
  it('gives a day the same key whatever the order of its exercises', () => {
    expect(lastSetsQuery([40, 12, 30, 12]).queryKey).toEqual(lastSetsQuery([12, 30, 40]).queryKey)
  })
})
