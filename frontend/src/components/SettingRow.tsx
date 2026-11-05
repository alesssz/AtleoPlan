/*
 * One row of a settings list (Profile): an icon in a tinted tile, a label
 * and a short explanation on the left, the control (a picker, a switch, a
 * status) on the right. On phones the control moves under the text.
 * The look of modern settings screens, in the energetic style
 * (docs/01-ui-design.md 1.5 "Visual style").
 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Props of SettingRow. */
interface SettingRowProps {
  /** The setting's icon (a lucide component). */
  icon: LucideIcon
  /** The setting's name, already translated. */
  label: string
  /** One line explaining it, already translated; optional. */
  description?: ReactNode
  /**
   * The id of the control, when it is a form field: the label then points
   * to it (htmlFor), so clicking the label focuses the control and screen
   * readers announce the label with it. Leave it out for a plain status.
   */
  controlId?: string
  /** The control itself: the JSX between <SettingRow> and </SettingRow>. */
  children: ReactNode
}

export function SettingRow({ icon: Icon, label, description, controlId, children }: SettingRowProps) {
  // `icon: Icon` renames the prop while destructuring: JSX needs a
  // capitalised name (<Icon />) to treat it as a component
  return (
    // Stacked on phones (flex-col), a row from 640 px (sm:flex-row) with the
    // text left and the control right (justify-between), vertically centred.
    // py-5: 20 px above and below; the parent draws the lines between rows
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      {/* Icon tile + texts, side by side */}
      <div className="flex items-start gap-4">
        {/* A 40 px rounded square tinted with lime, the icon in lime */}
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          {/* A real <label> when the control is a field (controlId given),
              otherwise a plain line of text. The ternary picks which
              element to draw; both look the same */}
          {controlId
            ? <label htmlFor={controlId} className="font-semibold">{label}</label>
            : <p className="font-semibold">{label}</p>}
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {/* The control: indented under the text on phones (pl-14 = icon width
          + gap), no indent once it sits on the right */}
      <div className="pl-14 sm:pl-0">{children}</div>
    </div>
  )
}
