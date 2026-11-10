/*
 * A plan file looked at in the browser (plan-file.ts): what it holds, and
 * each reason not to send it.
 */
import { describe, expect, it } from 'vitest'
import { MAX_PLAN_FILE_BYTES, readPlanFile } from './plan-file'

/** A plan file of two days, three exercises in all, as Export writes it. */
const file = {
  format: 'atleoplan.plan',
  version: 1,
  plan: { name: 'Calisthenics', days: [{ name: 'Day A', items: [{}, {}] }, { name: 'Day B', items: [{}] }] },
  exercises: [],
}

/**
 * Reads a value as if it were a file's text, of its real size.
 * @param value the file's content
 */
function read(value: unknown) {
  // The value as a file's text; its length stands for the size in bytes
  const text = JSON.stringify(value)
  return readPlanFile(text, text.length)
}

describe('readPlanFile', () => {
  it('sums up a plan file: its name, days and exercises', () => {
    expect(read(file)).toEqual({ ok: true, content: file, summary: { name: 'Calisthenics', days: 2, items: 3 } })
  })

  it('names the problem of anything else', () => {
    // Too big, from the size alone
    expect(readPlanFile('', MAX_PLAN_FILE_BYTES + 1)).toEqual({ ok: false, problem: 'tooBig' })
    // Not JSON: a CSV, say
    expect(readPlanFile('day;exercise;sets', 17)).toEqual({ ok: false, problem: 'notJson' })
    // JSON, but not ours, or ours with a broken plan
    // a plan in every way but its format: the format alone decides
    expect(read({ ...file, format: 'chronovault.export' })).toEqual({ ok: false, problem: 'notPlan' })
    expect(read([1, 2, 3])).toEqual({ ok: false, problem: 'notPlan' })
    expect(read({ ...file, version: '1' })).toEqual({ ok: false, problem: 'notPlan' })
    expect(read({ ...file, plan: { name: 'No days' } })).toEqual({ ok: false, problem: 'notPlan' })
    expect(read({ ...file, plan: { ...file.plan, days: [{ name: 'Day A' }] } })).toEqual({ ok: false, problem: 'notPlan' })
    // Ours, from a later version of the app
    expect(read({ ...file, version: 2 })).toEqual({ ok: false, problem: 'newer' })
  })
})
