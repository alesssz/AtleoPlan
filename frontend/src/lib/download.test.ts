/*
 * Saving a file from the browser (download.ts): the file's name made safe.
 * The download itself is tested where it is used, PlanDetailPage.test.tsx.
 */
import { describe, expect, it } from 'vitest'
import { fileNameOf } from './download'

describe('fileNameOf', () => {
  it('keeps letters and digits, lower case, the rest one dash', () => {
    expect(fileNameOf('Push Pull Legs!')).toBe('push-pull-legs')
    expect(fileNameOf('  Forza è 2026 ')).toBe('forza-e-2026')
    expect(fileNameOf('***')).toBe('plan')
  })
})
