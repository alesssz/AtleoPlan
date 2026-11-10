/*
 * The set's type, chosen from a list (docs/design/D1-ui.md D1.4.8, D1.4.9):
 * the button shows the set's number, or the type's letter (W, D, F); a tap
 * opens a list with every type written in full, its letter and a line on
 * what it means. Used by the plan editor (EditorSet.tsx) and by workout mode
 * (src/components/workout/SetRow.tsx).
 *
 * It replaced a button that went through the types one tap at a time: the
 * letters said nothing to someone who did not know them already.
 *
 * Built on Radix's Select, the same primitive as the shadcn/ui Select of
 * Profile (src/components/ui/select.tsx), with our own trigger: shadcn's
 * draws a bordered field with a chevron, too wide for a 48 px square. How
 * it works: docs/concepts/C1-frontend.md C1.16.9.
 */
import { useTranslation } from 'react-i18next'
// Radix's Select parts; only the Trigger is used from here, the rest comes
// styled from our select.tsx
import { Select as SelectPrimitive } from 'radix-ui'
import type { SetType } from '@/api/plans'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SET_TYPE_SIGNS, SET_TYPES } from './plan-draft'

/** Props of SetTypeSelect. */
interface SetTypeSelectProps {
  /** The set's type. */
  value: SetType
  /** Called with the type chosen. */
  onChange: (type: SetType) => void
  /** What the button shows for a normal set: its number. */
  number: number
  /** The button's name for screen readers: "Set 1, normal: change the type". */
  label: string
  /** The button's look: outlined in the editor, plain in workout mode. */
  variant: 'outline' | 'ghost'
}

/** The set's number or letter, opening the list of types. */
export function SetTypeSelect({ value, onChange, number, label, variant }: SetTypeSelectProps) {
  const { t } = useTranslation()

  return (
    // A controlled Select: the value comes from the set, onValueChange
    // hands back the one chosen, as plain text; `as SetType` tells
    // TypeScript it is one of ours, which holds: only SET_TYPES are offered
    <Select value={value} onValueChange={type => onChange(type as SetType)}>
      {/* asChild: Radix's Trigger lends its behaviour (opening, keyboard,
          the combobox role) to our Button instead of drawing its own.
          A warm-up is quieter, the other types lime; the name says the
          type in words, never the colour alone (D1.7) */}
      <SelectPrimitive.Trigger asChild>
        <Button
          variant={variant}
          size="icon-xl"
          aria-label={label}
          className={cn('font-heading text-base font-extrabold', value === 'warm_up' && 'text-muted-foreground', (value === 'drop' || value === 'failure') && 'text-primary', variant === 'outline' && (value === 'drop' || value === 'failure') && 'border-primary')}
        >
          {SET_TYPE_SIGNS[value] ?? number}
        </Button>
      </SelectPrimitive.Trigger>

      {/* The list, under the button (popper) rather than over it. Each
          type: its sign in a square, its name, a line on what it is */}
      <SelectContent position="popper" align="start" className="max-w-[min(20rem,calc(100vw-2rem))]">
        {SET_TYPES.map(type => (
          <SelectItem key={type} value={type} className="py-2">
            <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border font-heading font-extrabold', type === 'warm_up' && 'text-muted-foreground', (type === 'drop' || type === 'failure') && 'border-primary text-primary')}>
              {SET_TYPE_SIGNS[type] ?? number}
            </span>
            <span className="flex flex-col items-start whitespace-normal">
              <span className="font-semibold">{t(`plans.setTypeChoices.${type}.name`)}</span>
              <span className="text-xs text-muted-foreground">{t(`plans.setTypeChoices.${type}.hint`)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
