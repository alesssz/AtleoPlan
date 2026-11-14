/*
 * A plan file read in the browser, before anything is sent (Import plan,
 * ImportPlanButton.tsx): is it a plan file at all, and what does it hold? The
 * answer lets the window say so at once, and show what will be imported before
 * the user confirms.
 *
 * Only a first look: the backend checks every field (ImportPlanRequest),
 * and stays the one that decides. Here, what a person can be told in
 * words: too big, not JSON, not a plan, a plan of a later version.
 */

/** backend ExportPlan::FORMAT, VERSION */
export const PLAN_FILE = { format: 'atleoplan.plan', version: 1 } as const

/**
 * The largest file accepted, in bytes: 1 MB. A plan of 14 days with 30
 * exercises each, all described, is about a third of it; anything larger
 * is something else, and is not even read.
 */
export const MAX_PLAN_FILE_BYTES = 1024 * 1024

/** What a plan file holds, for the preview: "Calisthenics · 3 days · 23 exercises". */
export interface PlanFileSummary {
  name: string
  days: number
  /** An exercise done on two days counts twice. */
  items: number
}

/** Why a file is not imported, each said in its own words on screen. */
export type PlanFileProblem = 'tooBig' | 'notJson' | 'notPlan' | 'newer'

export type PlanFileReading
  = | { ok: true, content: unknown, summary: PlanFileSummary }
    | { ok: false, problem: PlanFileProblem }

/** Not null, a list or a number. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * @param bytes the file's size, in bytes (File.size)
 * @returns the content and its summary, or the problem
 */
export function readPlanFile(text: string, bytes: number): PlanFileReading {
  if (bytes > MAX_PLAN_FILE_BYTES) return { ok: false, problem: 'tooBig' }

  let content: unknown
  try {
    content = JSON.parse(text)
  }
  catch {
    return { ok: false, problem: 'notJson' }
  }

  if (!isObject(content) || content.format !== PLAN_FILE.format) return { ok: false, problem: 'notPlan' }
  // A version this app does not know yet: made by a later AtleoPlan
  if (typeof content.version === 'number' && content.version > PLAN_FILE.version) return { ok: false, problem: 'newer' }
  if (content.version !== PLAN_FILE.version) return { ok: false, problem: 'notPlan' }

  const plan = content.plan
  if (!isObject(plan) || typeof plan.name !== 'string' || !Array.isArray(plan.days)) return { ok: false, problem: 'notPlan' }
  const days = plan.days.filter((day): day is { items: unknown[] } => isObject(day) && Array.isArray(day.items))
  if (days.length !== plan.days.length) return { ok: false, problem: 'notPlan' }

  return {
    ok: true,
    content,
    summary: { name: plan.name, days: days.length, items: days.reduce((sum, day) => sum + day.items.length, 0) },
  }
}
