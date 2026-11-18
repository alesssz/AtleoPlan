/*
 * Online, reads ahead what a workout needs offline: the plan itself, each
 * day's last sets, and its exercises' photos. The answers are kept on the
 * phone with the rest of the cache, the photos by the service worker.
 */
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { planQuery, type Plan } from '@/api/plans'
import { lastSetsQuery } from '@/api/sessions'

/**
 * Both sizes of each photo, once: workout mode shows the thumbnails, How to
 * do it the large ones. Only with a service worker in control, whose photo
 * cache keeps them (vite.config.ts); without one, as in development, they
 * would be downloaded for nothing.
 */
async function downloadPhotos(plan: Plan): Promise<void> {
  if (!isControlled()) return
  const urls = new Set(plan.days.flatMap(day => day.items.flatMap(item =>
    item.exercise.photos.flatMap(photo => [photo.thumb_url, photo.url]))))
  // A photo already kept is answered by the worker, with no request
  await Promise.all([...urls].map(url => fetch(url).catch(() => undefined)))
}

function isControlled(): boolean {
  return 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)
}

/** At the app's very first opening the worker takes control only after Home has read ahead. */
function subscribeToController(onChange: () => void): () => void {
  if (!('serviceWorker' in navigator)) return () => {}
  const container = navigator.serviceWorker
  container.addEventListener('controllerchange', onChange)
  return () => container.removeEventListener('controllerchange', onChange)
}

/**
 * On Home for the active plan, on a plan's page for that plan. Prefetches, not
 * queries: nothing on screen shows these answers, so they must not be read
 * again at every return to the window. Runs again when the network returns,
 * and when a service worker takes control, for the photos.
 */
export function usePrepareWorkouts(planId: string | undefined): void {
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const language = i18n.language
  const online = useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline())
  const controlled = useSyncExternalStore(subscribeToController, isControlled)

  useEffect(() => {
    // Offline the requests would wait for the network: the copy is all there is
    if (!planId || !online) return
    void (async () => {
      try {
        // Fresh in the cache on the plan's page, so read only for Home
        const plan = await queryClient.fetchQuery(planQuery(planId, language))
        await Promise.all([
          ...plan.days
            .filter(day => day.items.length > 0)
            .map(day => queryClient.prefetchQuery(lastSetsQuery(day.items.map(item => item.exercise_id)))),
          downloadPhotos(plan),
        ])
      }
      catch {
        // Start reads them itself, or goes without
      }
    })()
  }, [planId, language, online, controlled, queryClient])
}
