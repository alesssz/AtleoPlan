/*
 * A few related rows of Profile's settings (SettingRow) under a short title,
 * in a card of their own: one long card is hard to scan. A <section> named by
 * its title, so screen readers can jump between groups.
 */
import { useId, type ReactNode } from 'react'

interface SettingGroupProps {
  title: string
  children: ReactNode
}

export function SettingGroup({ title, children }: SettingGroupProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="px-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h2>
      <div className="divide-y divide-border rounded-3xl border bg-card/60 px-6 backdrop-blur sm:px-8">
        {children}
      </div>
    </section>
  )
}
