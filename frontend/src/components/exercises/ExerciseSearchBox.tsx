/*
 * The library's search box, shared by the Exercises page and the plan
 * editor's picker. The spinner covers the debounce and the fetch, while the
 * old rows stay on screen: without it the list looks frozen.
 */
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

interface ExerciseSearchBoxProps {
  value: string
  /** At every key: the caller debounces. */
  onChange: (value: string) => void
  searching: boolean
}

export function ExerciseSearchBox({ value, onChange, searching }: ExerciseSearchBoxProps) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      {/* type="search": phones show a "Search" key */}
      <Input
        type="search"
        aria-label={t('exercises.searchLabel')}
        placeholder={t('exercises.searchPlaceholder')}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-12 rounded-xl pr-12 pl-12 md:text-base"
      />
      {/* Labelled, so screen readers say "Searching…" once, not at every key */}
      {searching && (
        <Spinner label={t('exercises.searching')} className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  )
}
