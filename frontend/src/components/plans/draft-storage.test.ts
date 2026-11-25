import { describe, expect, it } from 'vitest'
import { setDeviceOwner } from '@/lib/device-owner'
import { testUser } from '@/test/auth-helpers'
import { clearDraft, draftKey, loadDraft, storeDraft } from './draft-storage'
import type { PlanDraft } from './plan-draft'

/** Its content does not matter to the storage. */
const draft = { name: 'Push Pull Legs' } as unknown as PlanDraft

describe('draft-storage', () => {
  it('keeps each user\'s drafts apart on a shared phone', () => {
    storeDraft(draftKey('plan-ppl'), draft)

    setDeviceOwner(2)
    expect(loadDraft(draftKey('plan-ppl'))).toBeNull()
    clearDraft(draftKey('plan-ppl'))

    setDeviceOwner(testUser.id)
    expect(loadDraft(draftKey('plan-ppl'))?.draft).toEqual(draft)
  })

  it('keeps nothing while nobody is signed in', () => {
    setDeviceOwner(null)
    expect(draftKey('plan-ppl')).toBeNull()
    storeDraft(draftKey('plan-ppl'), draft)
    // Only drafts count: the device's own settings may be there
    expect(Object.keys(localStorage).filter(key => key.includes('planDraft'))).toEqual([])
  })
})
