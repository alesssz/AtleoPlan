/*
 * The search box of the exercise library, shared by the Exercises page
 * (through ExerciseFilters) and the plan editor's picker (ExercisePicker):
 * a magnifying glass on the left, the text, and on the right a spinner
 * while the list is being read again.
 *
 * Why the spinner: the list waits 300 ms after the last key before asking
 * the server, then keeps the old rows on screen until the new ones arrive
 * (keepPreviousData, src/api/exercises.ts). Without a sign, those moments
 * look like a frozen screen, and the new list seems to jump in from
 * nowhere. docs/concepts/C1-frontend.md C1.20.
 */
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

/** Props of ExerciseSearchBox. */
interface ExerciseSearchBoxProps {
  /** The text in the box, as typed. */
  value: string
  /**
   * Called at every key, with the new text.
   * @param value the box's text
   */
  onChange: (value: string) => void
  /** True while the list for this text is not on screen yet: the spinner turns. */
  searching: boolean
}

/** The box, its magnifying glass, and the spinner. */
export function ExerciseSearchBox({ value, onChange, searching }: ExerciseSearchBoxProps) {
  const { t } = useTranslation()

  return (
    // relative: the two icons are placed over the input, `absolute` against
    // this box; top-1/2 + -translate-y-1/2 centres them vertically
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      {/* type="search" gives phones a keyboard with a "Search" key.
          pl-12 / pr-12: room for the icons, so the text never runs under them */}
      <Input
        type="search"
        aria-label={t('exercises.searchLabel')}
        placeholder={t('exercises.searchPlaceholder')}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-12 rounded-xl pr-12 pl-12 md:text-base"
      />
      {/* The spinner, on the right, only while searching. With its label it
          is a status: screen readers say "Searching…" once, not at every key */}
      {searching && (
        <Spinner label={t('exercises.searching')} className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  )
}
