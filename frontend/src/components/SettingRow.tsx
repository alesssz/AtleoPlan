/*
 * A row of Profile's settings: icon, label and explanation, then the control,
 * which moves under the text on phones.
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface SettingRowProps {
  icon: LucideIcon
  label: string
  description?: ReactNode
  /**
   * When the control is a form field: the label points to it. Left out for a
   * plain status.
   */
  controlId?: string
  children: ReactNode
}

export function SettingRow({ icon: Icon, label, description, controlId, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="pl-14 sm:pl-0">{children}</div>
    </div>
  )
}
