import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { forgetAccountData, type User } from '@/api/auth'
import { setDeviceOwner } from '@/lib/device-owner'

/**
 * Ties the phone's storage to the user signed in (deviceOwner()), and drops
 * the cached answers once they are no longer that user's.
 *
 * Signing out drops them already (forgetAccount()). Not a session that ended
 * without it, expired or closed on another device: GET /api/user then answers
 * nobody, and the previous user's plans and Home, kept on the phone, would
 * show to whoever signs in next until each is read again.
 *
 * @param user `useCurrentUser().data`; undefined while still unknown
 */
export function useDeviceOwner(user: User | null | undefined): void {
  const queryClient = useQueryClient()
  const id = user?.id ?? null
  // In the render, not in an effect: the pages below read the storage in
  // their own first render, which comes before any effect
  setDeviceOwner(id)

  const previous = useRef(id)
  useEffect(() => {
    if (previous.current !== null && previous.current !== id) forgetAccountData(queryClient)
    previous.current = id
  }, [id, queryClient])
}
