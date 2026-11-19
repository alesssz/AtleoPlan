/*
 * Which of a superset's rounds show open, and which as one line. Kept out of
 * SupersetRounds.tsx so that file exports only components (Fast Refresh),
 * and tested on its own.
 */

/** Closed rounds in a row, this many or more, merge into one line. */
export const MERGE_ROUNDS_FROM = 2

/**
 * Rounds opened by a tap, from a line: one round, or a merged line's span,
 * with the state they had then.
 */
export interface OpenedRounds {
  from: number
  to: number
  /** Whether they were done: a round whose state changes since leaves. */
  done: boolean
}

/**
 * A round open on its own (the one in progress, or one opened from its own
 * line); a span opened from a merged line, shown as one compact block; or
 * closed rounds as one line (`from` = `to` for a single one).
 */
export type RoundBlock
  = | { kind: 'round', round: number }
    | { kind: 'span', from: number, to: number }
    | { kind: 'line', from: number, to: number, done: boolean, current?: boolean }

/**
 * The rounds as the screen shows them, in order. The round in progress is
 * open on its own, even inside a span opened earlier; closed by the user, it
 * is a line of its own, never merged, so it is not lost among the others.
 * Closed rounds in a row with the same state (all done, or not) merge from
 * MERGE_ROUNDS_FROM; a span left with one round shows as that round.
 *
 * A round opened stays open only in the state it was opened in: done rounds
 * unticked one by one fall back to lines "to do", merged with their
 * neighbours, and a round to do opened ahead closes once done, as the round
 * in progress does.
 * @param rounds how many rounds the superset has
 * @param isCurrent whether a round holds the set to do next
 * @param isDone whether every set of a round is ticked
 * @param opened what the user opened, by tapping lines
 * @param currentClosed the round in progress, when the user closed it
 */
export function roundBlocks(rounds: number, isCurrent: (round: number) => boolean, isDone: (round: number) => boolean, opened: readonly OpenedRounds[], currentClosed: number | null = null): RoundBlock[] {
  const blocks: RoundBlock[] = []
  for (let round = 0; round < rounds; round++) {
    const last = blocks[blocks.length - 1]
    if (isCurrent(round)) {
      blocks.push(round === currentClosed ? { kind: 'line', from: round, to: round, done: false, current: true } : { kind: 'round', round })
      continue
    }
    const done = isDone(round)
    const span = opened.find(candidate => candidate.from <= round && round <= candidate.to && candidate.done === done)
    if (span) {
      if (last?.kind === 'span' && last.to === round - 1 && last.from >= span.from) last.to = round
      else blocks.push({ kind: 'span', from: round, to: round })
      continue
    }
    if (last?.kind === 'line' && !last.current && last.done === done && last.to === round - 1) last.to = round
    else blocks.push({ kind: 'line', from: round, to: round, done })
  }
  return blocks.flatMap((block): RoundBlock[] => {
    // A span of one round is that round, open
    if (block.kind === 'span' && block.from === block.to) return [{ kind: 'round', round: block.from }]
    // Lines shorter than the threshold stay one per round
    if (block.kind === 'line' && block.to - block.from + 1 < MERGE_ROUNDS_FROM) {
      return Array.from({ length: block.to - block.from + 1 }, (_, offset) => ({ ...block, from: block.from + offset, to: block.from + offset }))
    }
    return [block]
  })
}

/** What stays opened once the rounds from `from` to `to` are closed again. */
export function closeRounds(opened: readonly OpenedRounds[], from: number, to: number): OpenedRounds[] {
  return opened.filter(span => span.to < from || span.from > to)
}
