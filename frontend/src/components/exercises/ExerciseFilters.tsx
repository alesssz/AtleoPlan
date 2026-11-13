/*
 * The library's search and filters (docs/design/D1-ui.md D1.4.3), in as
 * little room as they can take:
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
 * They stay at the top while the list scrolls: the whole row from 640 px,
 * the search box and Filters on phones, where the source scrolls away
 * (docs/concepts/C1-frontend.md C1.14.3). The search box is ExerciseSearchBox,
 * with its spinner while the page says a new list is on its way
 * (`searching`, C1.20).
 *
 * A controlled component (docs/concepts/C1-frontend.md C1.4): it holds no
 * filter of its own. The page gives it the values and is told of every
 * change, and keeps them in the address (src/pages/ExercisesPage.tsx), so
 * that going back to the list, or reloading it, finds the same filters. A
 * choice in the panel applies at once, as before; the panel's own state,
 * open or closed, is the one thing kept here.
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
  /** True while the list for these filters is not on screen yet: a spinner in the search box. */
  searching: boolean
}

/** The three choices of the source filter, in order. */
const SOURCES: readonly ExerciseSource[] = ['all', 'mine', 'public']

/** The classes of the two selects in the panel: 48 px tall, as the other fields (D1.5). */
const SELECT_CLASSES = 'w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:text-base'

/** The search box, the Filters button with its panel, and the source. */
export function ExerciseFilters({ values, onChange, searching }: ExerciseFiltersProps) {
  const { t, i18n } = useTranslation()
  // The two fixed lists, for the selects; empty while they load
  const muscles = useMuscles(i18n.language)
  const equipment = useEquipment(i18n.language)
  // Unique ids, linking each <label> to its field (React's useId)
  const muscleId = useId()
  const equipmentId = useId()
  // Whether the panel is open. useState: a value React keeps between
  // renders and redraws the component when it changes (C1.4)
  const [open, setOpen] = useState(false)
  // How many of the panel's two filters are on: the number on the button
  const active = (values.muscle !== '' ? 1 : 0) + (values.equipment !== '' ? 1 : 0)

  return (
    // One row holding everything, stuck to the top of the screen while the
    // list scrolls (sticky top-0): it scrolls with the page until it reaches
    // the top, then stays there. A translucent, blurred background keeps it
    // readable over the rows passing underneath; z-20 keeps it above them.
    //
    // On phones (max-sm: below 640 px) the row is `display: contents`: the
    // browser draws its children as if it were not there, so its own sticky,
    // background and padding do nothing. The inner row (search and Filters)
    // then sticks by itself (its max-sm: classes below), and the source,
    // under it, scrolls away. Why not a sticky row inside a block? A sticky
    // element sticks only within its parent, and this block is short: the
    // row would leave with it
    <div className="sticky top-0 z-20 -mt-2 flex items-center gap-3 bg-background/85 py-2 backdrop-blur max-sm:contents">
      {/* The search box and Filters, side by side. flex-1: this part takes
          the room the source leaves; min-w-0 lets it shrink below its
          content's width, so a long placeholder never pushes the row wider
          than the screen. On phones, the part that sticks */}
      <div className="flex min-w-0 flex-1 items-center gap-3 max-sm:sticky max-sm:top-0 max-sm:z-20 max-sm:-mt-2 max-sm:bg-background/85 max-sm:py-2 max-sm:backdrop-blur">
        {/* The search box (ExerciseSearchBox: the magnifying glass, and a
            spinner while the list is read again). role="search" makes it a
            landmark that screen readers can jump to */}
        <div role="search" className="min-w-0 flex-1">
          <ExerciseSearchBox value={values.search} onChange={search => onChange({ search })} searching={searching} />
        </div>

        {/* Filters and its panel: shadcn/ui's Sheet (src/components/ui/sheet.tsx),
            a dialog that slides in from an edge, here the bottom. Controlled
            (`open`, `onOpenChange`), so the panel's Show button can close it */}
        <Sheet open={open} onOpenChange={setOpen}>
          {/* SheetTrigger asChild: our Button opens the panel. relative:
              the number's badge is placed against the button's corner.
              On phones only the icon shows (a 48 px square, the text
              sr-only); `title` gives the name as a tooltip for a mouse */}
          <SheetTrigger asChild>
            <Button variant="outline" size="xl" title={t('exercises.filtersLabel')} className="relative px-4 max-sm:w-12 max-sm:px-0">
              <SlidersHorizontal aria-hidden="true" />
              <span className="max-sm:sr-only">{t('exercises.filtersLabel')}</span>
              {/* How many are on: a lime dot with the number, at the
                  button's top right. aria-hidden: screen readers get the
                  words after it instead of a bare number. The button's name
                  is its texts joined: "Filters, 2 active"; the comma, written
                  as a template literal (`, ${…}`), keeps the two from
                  running together as "Filters2 active". The dot: absolute
                  with negative offsets, half outside the corner; size-5,
                  20 px; grid place-items-center centres the number in it.
                  `<>…</>`, a fragment, groups the two spans without adding
                  an element */}
              {active > 0 && (
                <>
                  <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{active}</span>
                  <span className="sr-only">{`, ${t('exercises.filtersActive', { count: active })}`}</span>
                </>
              )}
            </Button>
          </SheetTrigger>

          {/* The panel, from the bottom, rounded at the top; the bottom
              padding clears the phone's gesture bar
              (env(safe-area-inset-bottom)), as workout mode's panels */}
          <SheetContent side="bottom" closeLabel={t('common.close')} className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* The content in a column no wider than a phone, centred: on a
                laptop the panel spans the window, the fields do not */}
            <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5">
              <SheetHeader className="px-0 pb-0">
                <SheetTitle className="font-heading text-xl font-extrabold">{t('exercises.filtersLabel')}</SheetTitle>
                {/* Radix asks every dialog for a description: here a real
                    one, since the list changes behind the panel */}
                <SheetDescription>{t('exercises.filtersText')}</SheetDescription>
              </SheetHeader>

              {/* Muscle group, with its label shown: inside the panel there
                  is room, and a visible label is clearer than the first
                  option alone */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={muscleId}>{t('exercises.muscleFilter')}</Label>
                <NativeSelect id={muscleId} value={values.muscle} onChange={event => onChange({ muscle: event.target.value })} className={SELECT_CLASSES}>
                  <NativeSelectOption value="">{t('exercises.allMuscles')}</NativeSelectOption>
                  {/* `?? []`: no options while the list loads */}
                  {(muscles.data ?? []).map(muscle => (
                    <NativeSelectOption key={muscle.slug} value={muscle.slug}>{muscle.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* Equipment, the same way */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={equipmentId}>{t('exercises.equipmentFilter')}</Label>
                <NativeSelect id={equipmentId} value={values.equipment} onChange={event => onChange({ equipment: event.target.value })} className={SELECT_CLASSES}>
                  <NativeSelectOption value="">{t('exercises.allEquipment')}</NativeSelectOption>
                  {(equipment.data ?? []).map(item => (
                    <NativeSelectOption key={item.slug} value={item.slug}>{item.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              {/* The buttons: Show closes the panel (SheetClose asChild, our
                  Button), the choices being already applied; Clear removes
                  both filters, and is off when there is nothing to clear.
                  flex-1: the two share the row equally */}
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

      {/* Source: three buttons side by side, one pressed. role="group" with
          a label tells screen readers they belong together; aria-pressed
          says which one is on (never colour alone, D1.7). 46 px plus the
          1 px border above and below: 48 px, the height of the search box
          and the smallest a finger hits reliably (D1.5). The whole width
          on phones (max-sm:w-full), its own width from 640 px (shrink-0) */}
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
