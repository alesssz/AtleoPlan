/*
 * Where the plan editor keeps its draft between visits: the browser's
 * localStorage, one entry per plan, saved automatically. Leaving the editor,
 * closing the tab or losing the battery keeps the changes; opening the editor
 * again brings them back; "Discard changes" and a save remove them.
 *
 * IndexedDB, planned for drafts, comes with the offline work; for one draft at
 * a time localStorage is enough. Every access is guarded: private mode, or full
 * or blocked storage, throws, and the editor must still work.
 */
import type { PlanDraft } from './plan-draft'

const PREFIX = 'atleoplan.planDraft.'

export interface StoredDraft {
  draft: PlanDraft
  savedAt: string
}

/**
 * The key of a plan's draft: its id, or "new" for the plan being created.
 * One new plan at a time is enough.
 * @param planId the plan's UUID, or undefined for a new plan
 */
export function draftKey(planId: string | undefined): string {
  return PREFIX + (planId ?? 'new')
}

/**
 * @returns the draft, or null when there is none, or it cannot be read
 */
export function loadDraft(key: string): StoredDraft | null {
  try {
    const text = localStorage.getItem(key)
    // Trusted: only this file writes these keys
    return text === null ? null : (JSON.parse(text) as StoredDraft)
  }
  catch {
    return null
  }
}

export function storeDraft(key: string, draft: PlanDraft): void {
  try {
    localStorage.setItem(key, JSON.stringify({ draft, savedAt: new Date().toISOString() } satisfies StoredDraft))
  }
  catch {
    // Storage full or blocked: the draft lives only on screen
  }
}

/**
 * Forgets a draft: after a save, or "Discard changes".
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  }
  catch {
    // Nothing to do: the draft could not have been kept either
  }
}
