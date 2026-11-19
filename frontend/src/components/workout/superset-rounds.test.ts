import { describe, expect, it } from 'vitest'
import { closeRounds, roundBlocks, type OpenedRounds } from './superset-rounds'

/** Six rounds, the fourth (index 3) in progress: three done before, two after. */
const current = (round: number) => round === 3
const done = (round: number) => round < 3

describe('roundBlocks', () => {
  it('opens the round in progress, and merges the closed ones from two in a row', () => {
    expect(roundBlocks(6, current, done, [])).toEqual([
      { kind: 'line', from: 0, to: 2, done: true },
      { kind: 'round', round: 3 },
      { kind: 'line', from: 4, to: 5, done: false },
    ])
  })

  it('keeps a closed round alone on its own line', () => {
    // The second of three rounds in progress
    expect(roundBlocks(3, round => round === 1, round => round < 1, [])).toEqual([
      { kind: 'line', from: 0, to: 0, done: true },
      { kind: 'round', round: 1 },
      { kind: 'line', from: 2, to: 2, done: false },
    ])
  })

  it('opens a merged line as one block, and a single line as its round', () => {
    const opened: OpenedRounds[] = [{ from: 0, to: 2, done: true }, { from: 5, to: 5, done: false }]

    expect(roundBlocks(6, current, done, opened)).toEqual([
      { kind: 'span', from: 0, to: 2 },
      { kind: 'round', round: 3 },
      { kind: 'line', from: 4, to: 4, done: false },
      { kind: 'round', round: 5 },
    ])
  })

  it('keeps the round in progress apart from a block opened around it', () => {
    // Rounds 4 to 6 opened while still to do; the fourth is now in progress
    expect(roundBlocks(6, current, done, [{ from: 3, to: 5, done: false }])).toEqual([
      { kind: 'line', from: 0, to: 2, done: true },
      { kind: 'round', round: 3 },
      { kind: 'span', from: 4, to: 5 },
    ])
  })

  it('shows the round in progress, closed by the user, as a line of its own', () => {
    // The fourth closed: not merged with the rounds to do after it
    expect(roundBlocks(6, current, done, [], 3)).toEqual([
      { kind: 'line', from: 0, to: 2, done: true },
      { kind: 'line', from: 3, to: 3, done: false, current: true },
      { kind: 'line', from: 4, to: 5, done: false },
    ])
    // A round closed earlier, no longer in progress, changes nothing
    expect(roundBlocks(6, current, done, [], 2)).toEqual(roundBlocks(6, current, done, []))
  })

  it('lets a round opened leave once its state changes', () => {
    // Every round done, all three opened together; then the last two
    // unticked, the second now in progress
    const opened: OpenedRounds[] = [{ from: 0, to: 2, done: true }]
    expect(roundBlocks(3, () => false, () => true, opened)).toEqual([{ kind: 'span', from: 0, to: 2 }])
    // The first stays open, alone, so as its round; the third, to do, is a line
    expect(roundBlocks(3, round => round === 1, round => round === 0, opened)).toEqual([
      { kind: 'round', round: 0 },
      { kind: 'round', round: 1 },
      { kind: 'line', from: 2, to: 2, done: false },
    ])
    // A round to do opened ahead closes once done
    expect(roundBlocks(3, round => round === 2, round => round < 2, [{ from: 1, to: 1, done: false }])).toEqual([
      { kind: 'line', from: 0, to: 1, done: true },
      { kind: 'round', round: 2 },
    ])
  })

  it('does not merge a done round with one still to do', () => {
    // Nothing in progress: the first two done, the third not
    expect(roundBlocks(3, () => false, round => round < 2, [])).toEqual([
      { kind: 'line', from: 0, to: 1, done: true },
      { kind: 'line', from: 2, to: 2, done: false },
    ])
  })
})

describe('closeRounds', () => {
  it('forgets every span that touches the rounds closed', () => {
    const opened: OpenedRounds[] = [{ from: 0, to: 2, done: true }, { from: 4, to: 4, done: false }]

    expect(closeRounds(opened, 1, 1)).toEqual([{ from: 4, to: 4, done: false }])
    expect(closeRounds(opened, 4, 4)).toEqual([{ from: 0, to: 2, done: true }])
  })
})
