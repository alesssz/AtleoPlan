/*
 * Where the plan editor keeps its draft between visits: the browser's
 * localStorage, one entry per plan (docs/design/D1-ui.md D1.4.8: "The draft is
 * saved automatically"). Leaving the editor, closing the tab or losing the
 * battery keeps the changes; opening the editor again brings them back;
 * "Discard changes" and a save remove them.
 *
 * localStorage holds text by key, in this browser only, and survives
 * reloads. A draft is a few kilobytes of JSON, well within its limits.
 * docs/design/D3-data-model.md D3.5.6 names IndexedDB, the browser's
 * database, for drafts: it comes with the offline work of FEAT-3, which needs
 * it for much more; for one draft at a time localStorage is enough
 * (docs/concepts/C1-frontend.md C1.16.4).
 *
 * Every access is in try/catch: a browser in private mode, or with storage
 * full or blocked, throws, and the editor must still work, only without
 * keeping the draft.
 */
import type { PlanDraft } from './plan-draft'

/** The start of every key, so the app's entries are easy to tell apart. */
const PREFIX = 'atleoplan.planDraft.'

/** What is kept: the draft, and when it was last changed. */
export interface StoredDraft {
  /** The draft. */
  draft: PlanDraft
  /** When it was last written, as ISO 8601 text. */
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
 * Reads a kept draft.
 * @param key the draft's key
 * @returns the draft, or null when there is none, or it cannot be read
 */
export function loadDraft(key: string): StoredDraft | null {
  try {
    const text = localStorage.getItem(key)
    // JSON.parse turns the text back into an object. The shape is trusted:
    // only this file writes these keys
    return text === null ? null : (JSON.parse(text) as StoredDraft)
  }
  catch {
    return null
  }
}

/**
 * Keeps a draft, replacing the one before.
 * @param key the draft's key
 * @param draft the draft
 */
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
 * @param key the draft's key
 */
export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  }
  catch {
    // Nothing to do: the draft could not have been kept either
  }
}
