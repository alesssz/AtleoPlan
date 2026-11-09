/*
 * The big stepper's arithmetic (stepper.ts): the step of each field, and the
 * text after a tap of − or +, in the user's language.
 */
import { describe, expect, it } from 'vitest'
import { FALLBACK_WEIGHT_STEP, fieldStep, stepValue } from './stepper'

describe('fieldStep', () => {
  it('moves the weight by the user\'s step, the others by a fixed one', () => {
    expect(fieldStep('weight', '2.50')).toBe(2.5)
    expect(fieldStep('weight', '5.00')).toBe(5)
    expect(fieldStep('reps', '2.50')).toBe(1)
    expect(fieldStep('seconds', '2.50')).toBe(5)
    expect(fieldStep('meters', '2.50')).toBe(10)
  })

  it('falls back to 2.5 when the setting is missing, zero or unreadable', () => {
    expect(fieldStep('weight', undefined)).toBe(FALLBACK_WEIGHT_STEP)
    expect(fieldStep('weight', '0.00')).toBe(FALLBACK_WEIGHT_STEP)
    expect(fieldStep('weight', 'abc')).toBe(FALLBACK_WEIGHT_STEP)
  })
})

describe('stepValue', () => {
  it('adds and takes away a step, written in the user\'s language', () => {
    expect(stepValue('80', 'weight', 2.5, 'en')).toBe('82.5')
    expect(stepValue('82,5', 'weight', 2.5, 'it')).toBe('85')
    expect(stepValue('85', 'weight', -2.5, 'it')).toBe('82,5')
    expect(stepValue('8', 'reps', 1, 'en')).toBe('9')
    expect(stepValue('30', 'seconds', -5, 'en')).toBe('25')
  })

  it('starts an empty or unreadable field from 0', () => {
    expect(stepValue('', 'weight', 2.5, 'en')).toBe('2.5')
    expect(stepValue('', 'reps', 1, 'en')).toBe('1')
    expect(stepValue('abc', 'reps', 1, 'en')).toBe('1')
  })

  it('writes the weight with two decimals at most', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in JavaScript
    expect(stepValue('0.1', 'weight', 0.2, 'en')).toBe('0.3')
    expect(stepValue('61.235', 'weight', 1.25, 'en')).toBe('62.49')
  })

  it('keeps reps, seconds and meters whole', () => {
    expect(stepValue('8,5', 'reps', 1, 'it')).toBe('10')
    expect(stepValue('29.6', 'seconds', 5, 'en')).toBe('35')
  })

  it('never goes below 0: a weight at 0 becomes empty, the body alone', () => {
    expect(stepValue('2.5', 'weight', -2.5, 'en')).toBe('')
    expect(stepValue('', 'weight', -2.5, 'en')).toBe('')
    expect(stepValue('1', 'reps', -1, 'en')).toBe('0')
    expect(stepValue('0', 'reps', -1, 'en')).toBe('0')
  })

  it('writes big numbers without a thousands separator, as the fields are typed', () => {
    expect(stepValue('995', 'meters', 10, 'en')).toBe('1005')
  })
})
