/*
 * ComingSoon: the small amber pill that marks what is not built yet, so a
 * screen already looks the way it will and is honest about what works
 * (docs/design/D1-ui.md D1.6). EmptyState shows it with `comingSoon`; the
 * plan screens put it next to a disabled button, such as Edit until the
 * plan editor exists. Components and props: docs/concepts/C1-frontend.md C1.4.
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** Props of ComingSoon. */
interface ComingSoonProps {
  /** Extra classes, such as a margin. */
  className?: string
}

/** The "Coming soon" pill, translated. */
export function ComingSoon({ className }: ComingSoonProps) {
  const { t } = useTranslation()

  return (
    // Amber text on a faint amber background (the theme's warning colour),
    // small capitals
    <span className={cn('rounded-full bg-warning/15 px-3 py-1 text-xs font-bold tracking-wider text-warning uppercase', className)}>
      {t('common.comingSoon')}
    </span>
  )
}
