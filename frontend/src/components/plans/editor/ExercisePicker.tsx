/*
 * The library's select mode, for the plan editor: a window with a search box
 * and the library's exercises, each with a tick box. "Add (n)" puts the ticked
 * ones in the day, in the order they were ticked.
 *
 * Workout mode uses it twice: Add exercises, as here, and **Swap exercise**
 * from the exercise's menu, where `replacing` turns it into a one-tap choice:
 * no tick boxes and no Add, a tap on a row picks it, and the list starts
 * filtered by the replaced exercise's main muscle, with a chip to show every
 * muscle. That window is opened by the menu, not by a button of its own: `open`
 * and `onOpenChange` let the screen control it.
 *
 * The same hook and search box as the Exercises page, so the two share the
 * cache and the spinner.
 *
 * **Create «…»**: after a search, a button under the list opens the exercise
 * editor's form (ExerciseForm) inside the window, the search as the name. The
 * exercise it creates is the user's own, and goes straight into the day with
 * the ticked ones (or replaces the exercise, when swapping), without leaving
 * the plan.
 */
import { ArrowLeft, Dumbbell, Plus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateExercise, useExercises, type Exercise } from '@/api/exercises'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExerciseSearchBox } from '@/components/exercises/ExerciseSearchBox'
import { emptyFormValues } from '@/components/exercises/exercise-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cn } from '@/lib/utils'

const SEARCH_DELAY_MS = 300

interface ExercisePickerProps {
  /** The button that opens it, drawn by the day; none when `open` is given. */
  trigger?: ReactNode
  /** Open or closed, when the caller controls it; left out, the picker does. */
  open?: boolean
  /** Called when the window opens or closes, with `open`. */
  onOpenChange?: (open: boolean) => void
  /** True when the day is full: the window does not open. */
  disabled?: boolean
  /**
   * The exercise being swapped, in workout mode: one tap picks one, the
   * list starts filtered by its main muscle, and it is left out of the list.
   */
  replacing?: Exercise
  /** Called with the ticked exercises, in the order they were ticked; one when swapping. */
  onAdd: (exercises: Exercise[]) => void
}

export function ExercisePicker({ trigger, open: openProp, onOpenChange, disabled = false, replacing, onAdd }: ExercisePickerProps) {
  const { t } = useTranslation()
  // The caller's `open` when given
  const [ownOpen, setOwnOpen] = useState(false)
  const open = openProp ?? ownOpen
  // Here, not in PickerBody, because the window's title changes too
  const [creating, setCreating] = useState(false)

  /**
   * Opens or closes the window; either way it starts again from the search.
   * @param next true to open
   */
  function change(next: boolean) {
    if (disabled) return
    setOwnOpen(next)
    setCreating(false)
    onOpenChange?.(next)
  }

  const title = creating ? t('exercises.editor.newTitle') : replacing ? t('workout.swapTitle') : t('plans.editor.picker.title')
  const description = creating
    ? t('plans.editor.picker.createDescription')
    : replacing ? t('workout.swapText', { name: replacing.name }) : t('plans.editor.picker.description')

  return (
    <Dialog open={open} onOpenChange={change}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {/* The list scrolls inside, so Add stays in sight */}
      <DialogContent closeLabel={t('common.close')} className="flex max-h-[85vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Drawn only while open: closing forgets the search and the ticks */}
        {open && (
          <PickerBody
            replacing={replacing}
            creating={creating}
            onCreatingChange={setCreating}
            onAdd={(exercises) => {
              onAdd(exercises)
              change(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface PickerBodyProps {
  /** The exercise being swapped; undefined when adding. */
  replacing?: Exercise
  /** True to show the form of a new exercise instead of the list. */
  creating: boolean
  /** Shows the form (true) or goes back to the list (false). */
  onCreatingChange: (creating: boolean) => void
  /** Called with the ticked exercises, or the one tapped when swapping. */
  onAdd: (exercises: Exercise[]) => void
}

function PickerBody({ replacing, creating, onCreatingChange, onAdd }: PickerBodyProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const create = useCreateExercise()
  // In the order they were ticked
  const [chosen, setChosen] = useState<Exercise[]>([])
  // Swapping: the replaced exercise's first main muscle, the filter the
  // list starts with; the chip turns it off and on
  const muscle = replacing?.muscles.find(candidate => candidate.role === 'primary')
  const [sameMuscle, setSameMuscle] = useState(muscle !== undefined)
  const debounced = useDebouncedValue(search, SEARCH_DELAY_MS)
  const list = useExercises({ search: debounced, muscle: sameMuscle ? muscle?.slug : undefined }, i18n.language)
  // While typing, or while the new list loads behind the old
  const searching = search !== debounced || list.isPlaceholderData
  // The one being swapped left out
  const exercises = (list.data?.pages.flatMap(page => page.data) ?? []).filter(exercise => exercise.id !== replacing?.id)

  /**
   * Ticks or unticks an exercise.
   * @param tick true to tick
   */
  function toggle(exercise: Exercise, tick: boolean) {
    setChosen(current => (tick ? [...current, exercise] : current.filter(other => other.id !== exercise.id)))
  }

  const typed = search.trim()

  // Creating: the exercise editor's form, in place of the list. The search
  // and the ticks are kept, so Cancel goes back to them as they were
  if (creating) {
    return (
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
        <button
          type="button"
          onClick={() => onCreatingChange(false)}
          className="inline-flex min-h-12 items-center gap-2 self-start text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('plans.editor.picker.backToSearch')}
        </button>
        <ExerciseForm
          defaultValues={emptyFormValues(typed)}
          save={create.mutateAsync}
          // The new exercise joins the ticked ones, in the day; when
          // swapping, it is the one chosen
          onSaved={exercise => onAdd(replacing ? [exercise] : [...chosen, exercise])}
          submitLabel={t('exercises.editor.create')}
          onCancel={() => onCreatingChange(false)}
        />
      </div>
    )
  }

  return (
    <>
      <ExerciseSearchBox value={search} onChange={setSearch} searching={searching} />

      {muscle && (
        <Button variant={sameMuscle ? 'secondary' : 'outline'} aria-pressed={sameMuscle} onClick={() => setSameMuscle(!sameMuscle)} className="self-start rounded-full">
          {t('workout.sameMuscle', { muscle: muscle.name })}
          {sameMuscle && <X aria-hidden="true" />}
        </Button>
      )}

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {list.isPending && (
          <div role="status" className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}
            <span className="sr-only">{t('exercises.loading')}</span>
          </div>
        )}
        {list.isError && <p role="alert">{t('exercises.loadError')}</p>}
        {list.isSuccess && exercises.length === 0 && <p className="text-muted-foreground">{t('exercises.noResultsText')}</p>}

        <ul className={cn('flex flex-col gap-1 transition-opacity', searching && 'opacity-60')}>
          {exercises.map((exercise) => {
            const cover = exercise.photos[0]
            const ticked = chosen.some(other => other.id === exercise.id)
            return (
              <li key={exercise.id}>
                {/* Swapping: the row is a button, and a tap picks it */}
                {replacing && (
                  <button type="button" onClick={() => onAdd([exercise])} className="flex min-h-14 w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted">
                    {cover
                      ? <img src={cover.thumb_url} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
                      : <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><Dumbbell className="size-4 text-muted-foreground" /></span>}
                    <span className="min-w-0 flex-1 truncate font-semibold">{exercise.name}</span>
                  </button>
                )}
                {/* The whole row is the tick box's label */}
                {!replacing && (
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-muted">
                    <Checkbox checked={ticked} onCheckedChange={value => toggle(exercise, value === true)} aria-label={t('plans.editor.picker.choose', { name: exercise.name })} className="size-5" />
                    {cover
                      ? <img src={cover.thumb_url} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
                      : <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted"><Dumbbell className="size-4 text-muted-foreground" /></span>}
                    <span className="min-w-0 flex-1 truncate font-semibold">{exercise.name}</span>
                  </label>
                )}
              </li>
            )
          })}
        </ul>

        {list.hasNextPage && (
          <Button variant="outline" className="mt-3 w-full" onClick={() => void list.fetchNextPage()} pending={list.isFetchingNextPage}>
            {t('exercises.showMore')}
          </Button>
        )}

        {/* After a search: the exercise is not there, or not quite the one
            wanted ("ponte" finds the glute bridge, not the full one), so it
            can be created, with the search as its name */}
        {typed !== '' && list.isSuccess && (
          <Button variant="outline" className="mt-3 w-full" onClick={() => onCreatingChange(true)}>
            <Plus aria-hidden="true" />
            {t('exercises.createNamed', { search: typed })}
          </Button>
        )}
      </div>

      {/* Add (n), when adding; swapping needs none, a tap is enough */}
      {!replacing && (
        <DialogFooter>
          <Button size="xl" disabled={chosen.length === 0} onClick={() => onAdd(chosen)}>
            {t('plans.editor.picker.add', { number: chosen.length })}
          </Button>
        </DialogFooter>
      )}
    </>
  )
}
