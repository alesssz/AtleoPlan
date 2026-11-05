/*
 * Shows whether the Laravel backend answers, from GET /api/health. The
 * first component reading server data, and the example of the three states
 * every such component handles: loading, error, success
 * (docs/01-ui-design.md 1.6, docs/04-frontend.md 4.6).
 *
 * The data comes from a TanStack Query hook (src/api/health.ts): the
 * component never fetches by itself nor keeps the answer in its own state.
 */
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHealth } from '@/api/health'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** The backend's state: a skeleton while checking, then a dot, a label and, when offline, a retry button. */
export function ServerStatus() {
  // The translate function, taken out of useTranslation()'s result
  // (`const { t } = …` is destructuring)
  const { t } = useTranslation()
  // Our hook (src/api/health.ts), wrapping TanStack Query's useQuery.
  // TanStack Query's state for this request; the component re-renders
  // by itself when it changes (pending → success or error)
  const health = useHealth()

  // 1. Loading: a grey placeholder shape (a "skeleton"), never a spinner
  //    over the whole page (1.6). `role="status"` + the hidden text tell
  //    screen readers what is going on. A component may return early:
  //    nothing below runs on this render.
  if (health.isPending) {
    return (
      // A row (flex), vertically centred, 12 px between the items
      <div role="status" className="flex items-center gap-3">
        {/* A round 12 px dot and a 16 × 160 px bar, the shapes of what will come */}
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-4 w-40" />
        {/* sr-only: invisible on screen, still read by screen readers */}
        <span className="sr-only">{t('server.checking')}</span>
      </div>
    )
  }

  // 2 and 3. Answered, or failed
  const online = health.isSuccess
  return (
    // The same row, allowed to wrap onto a second line on narrow screens
    <div className="flex flex-wrap items-center gap-3">
      {/* Never colour alone (1.7): the dot is backed by the text next to it.
          cn() joins the classes and picks the colour with a ternary
          (condition ? a : b): green when online, red otherwise */}
      {/* When online, a second dot behind the first grows and fades in a
          loop (animate-ping), like a heartbeat; skipped with reduced motion.
          `relative` + `absolute inset-0` put the two dots on top of each other */}
      <span aria-hidden="true" className="relative flex size-3">
        {online && <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />}
        <span className={cn('relative size-3 rounded-full', online ? 'bg-success' : 'bg-destructive')} />
      </span>
      <span className="text-sm">{online ? t('server.online') : t('server.offline')}</span>
      {!online && (
        // refetch() asks again; isFetching is true while it does, which
        // disables the button and spins the icon. refetch() returns a
        // Promise; `void` marks that we deliberately do not wait for it
        // (TanStack Query updates the state by itself).
        // onClick takes a function to call on click, not a call: hence `() =>`
        <Button variant="outline" size="sm" onClick={() => void health.refetch()} disabled={health.isFetching}>
          {/* `cond && 'class'` gives false when cond is false; cn() skips it */}
          <RefreshCw aria-hidden="true" className={cn(health.isFetching && 'animate-spin')} />
          {t('server.retry')}
        </Button>
      )}
    </div>
  )
}
