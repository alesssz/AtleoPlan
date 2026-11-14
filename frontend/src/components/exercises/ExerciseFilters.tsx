/*
 * The library's search and filters, in as little room as they can take:
 *
 *   phone:    [🔍 Search          ] [⚙2]     ← sticks to the top
 *             [ All | Mine | Public ]
 *   640 px+:  [🔍 Search                    ] [⚙ Filters 2] [All|Mine|Public]
 *
 * - The search box, the one control used every time.
 * - **Filters**, a button that opens a panel from the bottom of the screen
 *   (a sheet) with the muscle group and the equipment, used less often. The
 *   button shows how many of the two are on, so a filtered list never looks
 *   like the whole library. On phones only its icon shows.
 * - The source (all, mine, public): three buttons always in sight, one tap
 *   to switch.
 *
 * They stay at the top while the list scrolls: the whole row from 640 px, the
 * search box and Filters on phones, where the source scrolls away. The search
 * box is ExerciseSearchBox, with its spinner while the page says a new list is
 * on its way (`searching`).
 *
 * The page keeps the filters in the address, so going back or reloading
 * finds them; only the panel's open state lives here. A choice in the panel
 * applies at once.
 */
import { SlidersHorizontal } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEquipment } from '@/api/equipment'
import type { ExerciseSource } from '@/api/exercises'
import { useMuscles } from '@/api/muscles'
import { ExerciseSearchBox } from '@/components/exercises/ExerciseSearchBox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/** The values of the filters; an empty string means "no filter". */
export interface ExerciseFilterValues {
  search: string
  /** A muscle's slug, or ''. */
  muscle: string
  /** A kind of equipment's slug, or ''. */
  equipment: string
  source: ExerciseSource
}

interface ExerciseFiltersProps {
  values: ExerciseFilterValues
  /** Only the fields that changed, such as `{ muscle: 'chest' }`. */
  onChange: (changes: Partial<ExerciseFilterValues>) => void
  /** True while the list for these filters is not on screen yet: a spinner in the search box. */
  searching: boolean
}

const SOURCES: readonly ExerciseSource[] = ['all', 'mine', 'public']

/** 48 px, as the other fields. */
const SELECT_CLASSES = 'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base'

export function ExerciseFilters({ values, onChange, searching }: ExerciseFiltersProps) {
  const { t, i18n } = useTranslation()
  const muscles = useMuscles(i18n.language)
  const equipment = useEquipment(i18n.language)
  const muscleId = useId()
  const equipmentId = useId()
  const [open, setOpen] = useState(false)
  const active = (values.muscle !== '' ? 1 : 0) + (values.equipment !== '' ? 1 : 0)

  return (
    // Sticky from 640 px. On phones the row is `display: contents`, so the
    // inner row (search and Filters) sticks by itself and the source
    // scrolls away: a sticky element sticks only within its parent, and a
    // wrapping block would leave with it
    <div className="sticky top-0 z-20 -mt-2 flex items-center gap-3 bg-background/85 py-2 backdrop-blur max-sm:contents">
      {/* On phones, the part that sticks */}
      <div className="flex min-w-0 flex-1 items-center gap-3 max-sm:sticky max-sm:top-0 max-sm:z-20 max-sm:-mt-2 max-sm:bg-background/85 max-sm:py-2 max-sm:backdrop-blur">
        <div role="search" className="min-w-0 flex-1">
          <ExerciseSearchBox value={values.search} onChange={search => onChange({ search })} searching={searching} />
        </div>

        {/* Controlled, so the panel's Show button can close it */}
        <Sheet open={open} onOpenChange={setOpen}>
          {/* Icon only on phones; the name stays for screen readers and as
              a tooltip */}
          <SheetTrigger asChild>
            <Button variant="outline" size="xl" title={t('exercises.filtersLabel')} className="relative px-4 max-sm:w-12 max-sm:px-0">
              <SlidersHorizontal aria-hidden="true" />
              <span className="max-sm:sr-only">{t('exercises.filtersLabel')}</span>
              {/* Screen readers hear "Filters, 2 active", not a bare number;
                  the comma keeps the texts from running together */}
              {active > 0 && (
                <>
                  <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{active}</span>
                  <span className="sr-only">{`, ${t('exercises.filtersActive', { count: active })}`}</span>
                </>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" closeLabel={t('common.close')} className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5">
              <SheetHeader className="px-0 pb-0">
                <SheetTitle className="font-heading text-xl font-extrabold">{t('exercises.filtersLabel')}</SheetTitle>
                <SheetDescription>{t('exercises.filtersText')}</SheetDescription>
              </SheetHeader>

              {/* A visible label: clearer than the first option alone */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={muscleId}>{t('exercises.muscleFilter')}</Label>
                <NativeSelect id={muscleId} value={values.muscle} onChange={event => onChange({ muscle: event.target.value })} className={SELECT_CLASSES}>
                  <NativeSelectOption value="">{t('exercises.allMuscles')}</NativeSelectOption>
                  {(muscles.data ?? []).map(muscle => (
                    <NativeSelectOption key={muscle.slug} value={muscle.slug}>{muscle.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={equipmentId}>{t('exercises.equipmentFilter')}</Label>
                <NativeSelect id={equipmentId} value={values.equipment} onChange={event => onChange({ equipment: event.target.value })} className={SELECT_CLASSES}>
                  <NativeSelectOption value="">{t('exercises.allEquipment')}</NativeSelectOption>
                  {(equipment.data ?? []).map(item => (
                    <NativeSelectOption key={item.slug} value={item.slug}>{item.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* Show only closes: the choices are already applied */}
              <div className="flex gap-3">
                <Button variant="outline" size="xl" className="flex-1" disabled={active === 0} onClick={() => onChange({ muscle: '', equipment: '' })}>
                  {t('exercises.clearFilters')}
                </Button>
                <SheetClose asChild>
                  <Button size="xl" className="flex-1">{t('exercises.showResults')}</Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 46 px plus the borders: 48 px, the search box's height */}
      <div role="group" aria-label={t('exercises.sourceFilter')} className="flex shrink-0 overflow-hidden rounded-xl border bg-card/60 max-sm:mt-1 max-sm:w-full">
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
  )
}
