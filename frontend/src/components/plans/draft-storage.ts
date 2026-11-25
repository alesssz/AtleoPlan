/*
 * The plan editor's draft, kept in localStorage per plan and per user
 * (deviceOwner()) so that leaving the editor or closing the tab loses
 * nothing; a save or "Discard changes" removes it. Every access is guarded:
 * private mode, or full or blocked storage, throws, and the editor must still
 * work.
 */
import { ownedKey } from '@/lib/device-owner'
import type { PlanDraft } from './plan-draft'

const PREFIX = 'atleoplan.planDraft.'

export interface StoredDraft {
  draft: PlanDraft
  savedAt: string
}

/**
 * The key of a plan's draft for the user signed in: its id, or "new" for the
 * plan being created. One new plan at a time is enough.
 * @param planId the plan's UUID, or undefined for a new plan
 * @returns null when nobody is signed in: the draft is then never kept
 */
export function draftKey(planId: string | undefined): string | null {
  return ownedKey(PREFIX + (planId ?? 'new'))
}

/**
 * @returns the draft, or null when there is none, or it cannot be read
 */
export function loadDraft(key: string | null): StoredDraft | null {
  if (key === null) return null
  try {
    const text = localStorage.getItem(key)
    // Trusted: only this file writes these keys
    return text === null ? null : (JSON.parse(text) as StoredDraft)
  }
  catch {
    return null
  }
}

export function storeDraft(key: string | null, draft: PlanDraft): void {
  if (key === null) return
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
export function clearDraft(key: string | null): void {
  if (key === null) return
  try {
    localStorage.removeItem(key)
  }
  catch {
    // Nothing to do: the draft could not have been kept either
  }
}
