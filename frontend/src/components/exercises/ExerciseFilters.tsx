/*
 * The library's search and filters (docs/design/D1-ui.md D1.4.3): a search
 * box, then the muscle group, the equipment, and the source (all, mine,
 * public). They stay at the top while the list scrolls: all of them from
 * 640 px, the search box alone on phones, where the stacked filters would
 * take a quarter of the screen (docs/concepts/C1-frontend.md C1.14.3).
 *
 * A controlled component (docs/concepts/C1-frontend.md C1.4): it holds no
 * state. The page gives it the values and is told of every change, and keeps
 * them in the address (src/pages/ExercisesPage.tsx), so that going back to the
 * list, or reloading it, finds the same filters.
 */
import { Search } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useEquipment } from '@/api/equipment'
import type { ExerciseSource } from '@/api/exercises'
import { useMuscles } from '@/api/muscles'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

/** The values of the filters; an empty string means "no filter". */
export interface ExerciseFilterValues {
  /** The text in the search box, as typed. */
  search: string
  /** A muscle's slug, or ''. */
  muscle: string
  /** A kind of equipment's slug, or ''. */
  equipment: string
  /** Which exercises to show. */
  source: ExerciseSource
}

/** Props of ExerciseFilters. */
interface ExerciseFiltersProps {
  /** The current values. */
  values: ExerciseFilterValues
  /**
   * Called with the fields that changed, such as `{ muscle: 'chest' }`.
   * `Partial<T>`: the same fields as T, all optional.
   */
  onChange: (changes: Partial<ExerciseFilterValues>) => void
}

/** The three choices of the source filter, in order. */
const SOURCES: readonly ExerciseSource[] = ['all', 'mine', 'public']

/** The search box and the filters. */
export function ExerciseFilters({ values, onChange }: ExerciseFiltersProps) {
  const { t, i18n } = useTranslation()
  // The two fixed lists, for the selects; empty while they load
  const muscles = useMuscles(i18n.language)
  const equipment = useEquipment(i18n.language)
  // Unique ids, linking each <label> to its field (React's useId)
  const muscleId = useId()
  const equipmentId = useId()

  return (
    // One block holding everything, stuck to the top of the screen while the
    // list scrolls (sticky top-0): it scrolls with the page until it reaches
    // the top, then stays there. A translucent, blurred background keeps it
    // readable over the rows passing underneath; z-20 keeps it above them.
    //
    // On phones (max-sm: below 640 px) the block is `display: contents`: the
    // browser draws its children as if it were not there, so its own sticky,
    // background and padding do nothing. The search box then sticks by itself
    // (its max-sm: classes below), and the filters scroll away. Why not a
    // sticky search box inside the block? A sticky element sticks only within
    // its parent, and this block is short: the box would leave with it
    <div className="sticky top-0 z-20 -mt-2 bg-background/85 py-2 backdrop-blur max-sm:contents">
      {/* The search box, with a magnifying glass inside on the left. On
          phones it is the part that sticks, with the same look as the block
          above. role="search" makes it a landmark that screen readers can
          jump to. type="search" gives phones a keyboard with a "Search" key */}
      <div role="search" className="max-sm:sticky max-sm:top-0 max-sm:z-20 max-sm:-mt-2 max-sm:bg-background/85 max-sm:py-2 max-sm:backdrop-blur">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t('exercises.searchLabel')}
            placeholder={t('exercises.searchPlaceholder')}
            value={values.search}
            onChange={event => onChange({ search: event.target.value })}
            className="h-12 rounded-xl pl-12 md:text-base"
          />
        </div>
      </div>

      {/* The filters: stacked on phones, in one row from 640 px */}
      <div className="mt-1 grid gap-3 sm:mt-3 sm:grid-cols-[1fr_1fr_auto]">
        {/* Muscle group. sr-only: the label is read by screen readers but not
            shown, since the first option already says what the field is */}
        <div>
          <label htmlFor={muscleId} className="sr-only">{t('exercises.muscleFilter')}</label>
          <NativeSelect id={muscleId} value={values.muscle} onChange={event => onChange({ muscle: event.target.value })} className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base">
            <NativeSelectOption value="">{t('exercises.allMuscles')}</NativeSelectOption>
            {/* `?? []`: no options while the list loads */}
            {(muscles.data ?? []).map(muscle => (
              <NativeSelectOption key={muscle.slug} value={muscle.slug}>{muscle.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Equipment, the same way */}
        <div>
          <label htmlFor={equipmentId} className="sr-only">{t('exercises.equipmentFilter')}</label>
          <NativeSelect id={equipmentId} value={values.equipment} onChange={event => onChange({ equipment: event.target.value })} className="w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base">
            <NativeSelectOption value="">{t('exercises.allEquipment')}</NativeSelectOption>
            {(equipment.data ?? []).map(item => (
              <NativeSelectOption key={item.slug} value={item.slug}>{item.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Source: three buttons side by side, one pressed. role="group" with
            a label tells screen readers they belong together; aria-pressed
            says which one is on (never colour alone, D1.7). 46 px plus the
            1 px border above and below: 48 px, the height of the selects and
            the smallest a finger hits reliably (D1.5) */}
        <div role="group" aria-label={t('exercises.sourceFilter')} className="flex overflow-hidden rounded-xl border bg-card/60">
          {SOURCES.map(source => (
            <button
              key={source}
              type="button"
              aria-pressed={values.source === source}
              onClick={() => onChange({ source })}
              className={cn(
                'min-h-[46px] flex-1 px-4 text-sm font-semibold transition-colors',
                values.source === source ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`exercises.source.${source}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
