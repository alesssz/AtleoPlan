/*
 * Whether the backend answers, from GET /api/health.
 */
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHealth } from '@/api/health'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ServerStatus() {
  const { t } = useTranslation()
  const health = useHealth()

  // A skeleton, never a spinner
  if (health.isPending) {
    return (
      <div role="status" className="flex items-center gap-3">
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <span className="sr-only">{t('server.checking')}</span>
      </div>
    )
  }

  const online = health.isSuccess
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Never colour alone: the text says it too. Online, a second
          dot pulses behind the first, unless motion is reduced */}
      <span aria-hidden="true" className="relative flex size-3">
        {online && <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:animate-none" />}
        <span className={cn('relative size-3 rounded-full', online ? 'bg-success' : 'bg-destructive')} />
      </span>
      <span className="text-sm">{online ? t('server.online') : t('server.offline')}</span>
      {!online && (
        <Button variant="outline" size="sm" onClick={() => void health.refetch()} disabled={health.isFetching}>
          <RefreshCw aria-hidden="true" className={cn(health.isFetching && 'animate-spin')} />
          {t('server.retry')}
        </Button>
      )}
    </div>
  )
}
