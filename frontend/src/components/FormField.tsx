/*
 * One field of a form: label, input and, when there is one, its error, wired
 * together for screen readers. Every form of the app uses it, so all fields
 * look and behave alike. Forms: docs/concepts/C1-frontend.md C1.13.
 */
import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Props of FormField. `extends ComponentProps<'input'>` adds every prop a real
 * <input> accepts (type, autoComplete…), which are passed on to it, including
 * what react-hook-form's register() returns.
 */
interface FormFieldProps extends ComponentProps<'input'> {
  /** The field's name on screen, already translated. */
  label: string
  /** The error to show under the field, already translated; none when valid. */
  error?: string
}

/**
 * A labelled text field, 48 px tall as touch screens need
 * (docs/design/D1-ui.md D1.1). The text is 16 px on purpose: below that, iPhones
 * zoom into the page when a field is focused.
 */
export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  // A unique id (React's useId hook) to link the label and the error to the
  // field; the error's id is derived from it
  const id = useId()
  const errorId = `${id}-error`

  return (
    // A column with 8 px between label, field and error
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {/* aria-invalid draws the field in red and tells screen readers it is
          wrong; aria-describedby makes them read the error with the field.
          `cond ? a : undefined`: the attribute is left out when there is no error */}
      <Input
        id={id}
        className="h-12 rounded-xl px-4 md:text-base"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {/* role="alert": screen readers announce the message as soon as it appears */}
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
