/*
 * Marks what is not built yet, so a screen already looks the way it will and is
 * honest about what works.
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
  className?: string
}

export function ComingSoon({ className }: ComingSoonProps) {
  const { t } = useTranslation()

  return (
    <span className={cn('rounded-full bg-warning/15 px-3 py-1 text-xs font-bold tracking-wider text-warning uppercase', className)}>
      {t('common.comingSoon')}
    </span>
  )
}
