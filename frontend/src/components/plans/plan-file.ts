/*
 * A plan file read in the browser, before anything is sent (Import plan,
 * ImportPlanButton.tsx): is it a plan file at all, and what does it hold?
 * The answer lets the window say so at once, and show what will be
 * imported before the user confirms. Plain functions, no React, tested in
 * plan-file.test.ts. How it works: docs/concepts/C1-frontend.md C1.15.6.
 *
 * Only a first look: the backend checks every field (ImportPlanRequest),
 * and stays the one that decides. Here, what a person can be told in
 * words: too big, not JSON, not a plan, a plan of a later version.
 */

/**
 * The format and version of the plan file this app reads (backend
 * ExportPlan::FORMAT, VERSION). `as const`: the exact values, read-only,
 * rather than any string and any number.
 */
export const PLAN_FILE = { format: 'atleoplan.plan', version: 1 } as const

/**
 * The largest file accepted, in bytes: 1 MB. A plan of 14 days with 30
 * exercises each, all described, is about a third of it; anything larger
 * is something else, and is not even read.
 */
export const MAX_PLAN_FILE_BYTES = 1024 * 1024

/** What a plan file holds, for the preview: "Calisthenics · 3 days · 23 exercises". */
export interface PlanFileSummary {
  /** The plan's name. */
  name: string
  /** How many days. */
  days: number
  /** How many exercises in all the days, an exercise done on two days counted twice. */
  items: number
}

/** Why a file is not imported, each said in its own words on screen. */
export type PlanFileProblem = 'tooBig' | 'notJson' | 'notPlan' | 'newer'

/**
 * The result of reading a file: the content and its summary, or the
 * problem. A **discriminated union**: `ok` says which, and after
 * `if (result.ok)` TypeScript knows `content` and `summary` are there.
 */
export type PlanFileReading
  = | { ok: true, content: unknown, summary: PlanFileSummary }
    | { ok: false, problem: PlanFileProblem }

/**
 * Whether a value is a plain object, `{ … }`, and not null, a list or a
 * number. A **type guard**: its return type, `value is Record<…>`, tells
 * TypeScript what the value is when it returns true.
 * @param value anything
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reads a file's text as a plan file.
 * @param text the file's text
 * @param bytes the file's size, in bytes (File.size)
 * @returns the content and its summary, or the problem
 */
export function readPlanFile(text: string, bytes: number): PlanFileReading {
  if (bytes > MAX_PLAN_FILE_BYTES) return { ok: false, problem: 'tooBig' }

  // The text as data; JSON.parse() throws on anything that is not JSON
  let content: unknown
  try {
    content = JSON.parse(text)
  }
  catch {
    return { ok: false, problem: 'notJson' }
  }

  // Ours? `format` says what the file is
  if (!isObject(content) || content.format !== PLAN_FILE.format) return { ok: false, problem: 'notPlan' }
  // A version this app does not know yet: made by a later AtleoPlan
  if (typeof content.version === 'number' && content.version > PLAN_FILE.version) return { ok: false, problem: 'newer' }
  if (content.version !== PLAN_FILE.version) return { ok: false, problem: 'notPlan' }

  // The plan, with a name and a list of days, each with a list of items
  const plan = content.plan
  if (!isObject(plan) || typeof plan.name !== 'string' || !Array.isArray(plan.days)) return { ok: false, problem: 'notPlan' }
  // The days that are objects with a list of items; any other is wrong
  const days = plan.days.filter((day): day is { items: unknown[] } => isObject(day) && Array.isArray(day.items))
  if (days.length !== plan.days.length) return { ok: false, problem: 'notPlan' }

  return {
    ok: true,
    content,
    // reduce(): the sum of the items of every day
    summary: { name: plan.name, days: days.length, items: days.reduce((sum, day) => sum + day.items.length, 0) },
  }
}
