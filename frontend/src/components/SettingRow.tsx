/*
 * A row of Profile's settings: icon, label and explanation, then the control,
 * which moves under the text on phones, unless it is small enough to stay
 * beside it (a switch).
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SettingRowProps {
  icon: LucideIcon
  label: string
  description?: ReactNode
  /**
   * When the control is a form field: the label points to it. Left out for a
   * plain status.
   */
  controlId?: string
  /**
   * A compact control, such as a switch, that stays on the label's line on
   * phones too: a row of its own for it would only make the page longer.
   */
  inline?: boolean
  children: ReactNode
}

export function SettingRow({ icon: Icon, label, description, controlId, inline = false, children }: SettingRowProps) {
  return (
    <div className={cn('flex gap-4 py-5', inline ? 'items-center justify-between' : 'flex-col sm:flex-row sm:items-center sm:justify-between')}>
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          {controlId
            ? <label htmlFor={controlId} className="font-semibold">{label}</label>
            : <p className="font-semibold">{label}</p>}
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {/* On phones, aligned with the text rather than the icon */}
      <div className={cn('shrink-0', !inline && 'pl-14 sm:pl-0')}>{children}</div>
    </div>
  )
}
