/*
 * Online, reads ahead what Start needs for a plan: the plan itself and, for
 * each day, last time's sets. Kept on the phone with the rest of the cache,
 * they let a workout start offline with its Last column filled.
 */
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { planQuery } from '@/api/plans'
import { lastSetsQuery } from '@/api/sessions'

/**
 * On Home for the active plan, on a plan's page for that plan. Prefetches, not
 * queries: nothing on screen shows these answers, so they must not be read
 * again at every return to the window. Runs again when the network returns.
 */
export function usePrepareWorkouts(planId: string | undefined): void {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const language = i18n.language
  const online = useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline())

  useEffect(() => {
    // Offline the requests would wait for the network: the copy is all there is
    if (!planId || !online) return
    void (async () => {
      try {
        // Fresh in the cache on the plan's page, so read only for Home
        const plan = await queryClient.fetchQuery(planQuery(planId, language))
        await Promise.all(plan.days
          .filter(day => day.items.length > 0)
          .map(day => queryClient.prefetchQuery(lastSetsQuery(day.items.map(item => item.exercise_id)))))
      }
      catch {
        // Start reads them itself, or goes without
      }
    })()
  }, [planId, language, online, queryClient])
}
