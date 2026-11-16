/*
 * "How did it feel?", 1 to 5, in the summary. A tap on the chosen value takes
 * it back: the question may stay unanswered. A radio group drawn as buttons,
 * which are easier to hit than radio dots.
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FEELINGS, feelingName } from './feeling'

interface FeelingPickerProps {
  value: number | null
  /** null when the chosen value is tapped again. */
  onChange: (value: number | null) => void
}

export function FeelingPicker({ value, onChange }: FeelingPickerProps) {
  const { t } = useTranslation()

  return (
    <div role="radiogroup" aria-labelledby="feeling-title" className="flex flex-col gap-3">
      <h2 id="feeling-title" className="font-heading text-lg font-extrabold tracking-tight">{t('summary.feelingTitle')}</h2>
      <div className="grid grid-cols-5 gap-2">
        {FEELINGS.map((feeling) => {
          const chosen = feeling === value
          return (
            <button
              key={feeling}
              type="button"
              role="radio"
              aria-checked={chosen}
              // Without it, the two spans read as one word, "4Good"
              aria-label={`${feeling}, ${feelingName(feeling, t)}`}
              onClick={() => onChange(chosen ? null : feeling)}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 transition-colors',
                chosen ? 'border-primary bg-primary/15 text-foreground' : 'border-input bg-input/30 text-muted-foreground hover:bg-input/50',
              )}
            >
              <span className="font-heading text-xl font-black tabular-nums">{feeling}</span>
              <span className="w-full truncate text-center text-[11px] font-semibold">{feelingName(feeling, t)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
