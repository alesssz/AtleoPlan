/*
 * "How did it feel?", from 1 to 5, in the summary (docs/design/D1-ui.md
 * D1.4.10): five buttons, of which one at most is chosen. A tap on the
 * chosen one takes the choice back: the question may stay unanswered.
 *
 * For screen readers it is a radio group (role="radiogroup", each button
 * role="radio" with aria-checked), the pattern of "one of several", drawn
 * as buttons because they are easier to hit than round radio dots. The
 * values and their words: feeling.ts.
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FEELINGS, feelingName } from './feeling'

/** Props of FeelingPicker. */
interface FeelingPickerProps {
  /** The value chosen, or null for none. */
  value: number | null
  /**
   * Called with the new value, or null when the chosen one is tapped again.
   * @param value 1 to 5, or null
   */
  onChange: (value: number | null) => void
}

/** Five buttons, each a number with its word under it ("4, Good"). */
export function FeelingPicker({ value, onChange }: FeelingPickerProps) {
  const { t } = useTranslation()

  return (
    <div role="radiogroup" aria-labelledby="feeling-title" className="flex flex-col gap-3">
      <h2 id="feeling-title" className="font-heading text-lg font-extrabold tracking-tight">{t('summary.feelingTitle')}</h2>
      {/* Five equal columns, 8 px apart */}
      <div className="grid grid-cols-5 gap-2">
        {FEELINGS.map((feeling) => {
          // Whether this one is the value chosen
          const chosen = feeling === value
          return (
            <button
              key={feeling}
              type="button"
              role="radio"
              aria-checked={chosen}
              // Its name, "4, Good": without it, the two spans would be
              // read as one word, "4Good"
              aria-label={`${feeling}, ${feelingName(feeling, t)}`}
              onClick={() => onChange(chosen ? null : feeling)}
              // 64 px tall, a lime border and tint when chosen
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 transition-colors',
                chosen ? 'border-primary bg-primary/15 text-foreground' : 'border-input bg-input/30 text-muted-foreground hover:bg-input/50',
              )}
            >
              <span className="font-heading text-xl font-black tabular-nums">{feeling}</span>
              {/* "Awful" … "Great"; small, and cut with "…" if a language's word is long */}
              <span className="w-full truncate text-center text-[11px] font-semibold">{feelingName(feeling, t)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
