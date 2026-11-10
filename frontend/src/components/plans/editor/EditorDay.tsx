/*
 * One day's exercises in the plan editor (docs/design/D1-ui.md D1.4.8), under
 * its tab in the second step (EditorDays): the exercises in an order changed
 * by dragging, the choice of exercises to join in a superset, and the button
 * that adds exercises from the library. The day's name and the number of
 * days are set in the first step (EditorOverview).
 *
 * Dragging uses dnd-kit (docs/design/D2-decisions.md D2.2), which works with
 * a mouse, a finger and the keyboard: DndContext watches the drag,
 * SortableContext knows the order of the list, and each EditorItem is
 * sortable through its handle. When a drag ends, the day sends one action,
 * moveItem, and the reducer does the rest (docs/concepts/C1-frontend.md C1.16.3).
 */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Link2, Plus } from 'lucide-react'
import { useState, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { WeightUnit } from '@/lib/format'
import { LIMITS, type DraftAction, type DraftDay } from '../plan-draft'
import { EditorItem } from './EditorItem'
import { ExercisePicker } from './ExercisePicker'

/** Props of EditorDay. */
interface EditorDayProps {
  /** The day. */
  day: DraftDay
  /** Its index among the plan's days. */
  dayIndex: number
  /** Every day of the plan, for "Move to another day". */
  days: DraftDay[]
  /** Sends an action to the editor's reducer. */
  dispatch: Dispatch<DraftAction>
  /** The translated error of a field, by its path; undefined when none. */
  errorOf: (path: string) => string | undefined
  /** The user's weight unit. */
  unit: WeightUnit
  /** The user's default rest, in seconds. */
  defaultRestSeconds: number
  /** The interface's language. */
  language: string
}

/** A day of the plan, being edited. */
export function EditorDay({ day, dayIndex, days, dispatch, errorOf, unit, defaultRestSeconds, language }: EditorDayProps) {
  const { t } = useTranslation()
  // Whether the day is choosing exercises for a superset, and which ones (by id)
  const [selecting, setSelecting] = useState(false)
  const [chosen, setChosen] = useState<string[]>([])
  // Which exercises are open, by id
  const [open, setOpen] = useState<string[]>([])

  // How a drag can start. PointerSensor: a mouse or a finger, once it has
  // moved 5 px, so a tap on the handle is not a drag. KeyboardSensor: space
  // or enter on the handle, then the arrows; sortableKeyboardCoordinates
  // moves one place per arrow
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /**
   * The name of an exercise by its id, for what screen readers announce.
   * @param id the exercise's id in the plan
   */
  function nameOf(id: string | number): string {
    return day.items.find(item => item.id === id)?.exercise.name ?? ''
  }

  /**
   * The place of an exercise, from 1, for the announcements.
   * @param id the exercise's id in the plan
   */
  function positionOf(id: string | number): number {
    return day.items.findIndex(item => item.id === id) + 1
  }

  // What dnd-kit says to screen readers during a drag, in the user's
  // language (its own texts are English)
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('plans.editor.dnd.pickedUp', { name: nameOf(active.id) }),
    onDragOver: ({ active, over }) => over ? t('plans.editor.dnd.movedOver', { name: nameOf(active.id), position: positionOf(over.id), total: day.items.length }) : undefined,
    onDragEnd: ({ active, over }) => over ? t('plans.editor.dnd.dropped', { name: nameOf(active.id), position: positionOf(over.id), total: day.items.length }) : undefined,
    onDragCancel: ({ active }) => t('plans.editor.dnd.cancelled', { name: nameOf(active.id) }),
  }

  /**
   * A drag has ended: moves the exercise to where it was dropped.
   * @param event dnd-kit's event: `active` was dragged, `over` is where it ended
   */
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = day.items.findIndex(item => item.id === active.id)
    const to = day.items.findIndex(item => item.id === over.id)
    dispatch({ type: 'moveItem', day: dayIndex, from, to })
  }

  /** Ends the choice of exercises for a superset, ticking none. */
  function stopSelecting() {
    setSelecting(false)
    setChosen([])
  }

  /** Joins the chosen exercises in a superset, and ends the choice. */
  function join() {
    const indexes = chosen.map(id => day.items.findIndex(item => item.id === id))
    dispatch({ type: 'joinSuperset', day: dayIndex, items: indexes })
    stopSelecting()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The exercises */}
      {day.items.length === 0
        ? <p className="text-muted-foreground">{t('plans.editor.noItems')}</p>
        : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onDragEnd}
              accessibility={{ announcements, screenReaderInstructions: { draggable: t('plans.editor.dnd.instructions') } }}
            >
              {/* items: the ids, in the list's order */}
              <SortableContext items={day.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-2">
                  {day.items.map((item, index) => (
                    <EditorItem
                      key={item.id}
                      item={item}
                      at={{ day: dayIndex, item: index }}
                      days={days}
                      dispatch={dispatch}
                      errorOf={errorOf}
                      unit={unit}
                      defaultRestSeconds={defaultRestSeconds}
                      language={language}
                      open={open.includes(item.id)}
                      onToggle={() => setOpen(ids => (ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id]))}
                      selecting={selecting}
                      chosen={chosen.includes(item.id)}
                      onChoose={choose => setChosen(ids => (choose ? [...ids, item.id] : ids.filter(id => id !== item.id)))}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

      {/* Adding exercises, and making a superset */}
      {selecting
        ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
              <p className="text-sm">{t('plans.editor.selectHint')}</p>
              <div className="flex flex-wrap gap-3">
                <Button size="xl" disabled={chosen.length < 2} onClick={join}>
                  <Link2 aria-hidden="true" />
                  {t('plans.editor.joinSuperset', { number: chosen.length })}
                </Button>
                <Button size="xl" variant="ghost" onClick={stopSelecting}>
                  {t('plans.editor.selectDone')}
                </Button>
              </div>
            </div>
          )
        : (
            <div className="flex flex-wrap gap-3">
              <ExercisePicker
                disabled={day.items.length >= LIMITS.items}
                onAdd={exercises => dispatch({ type: 'addExercises', day: dayIndex, exercises })}
                trigger={(
                  <Button size="xl" variant="outline" disabled={day.items.length >= LIMITS.items}>
                    <Plus aria-hidden="true" />
                    {t('plans.editor.addExercises')}
                  </Button>
                )}
              />
              {day.items.length >= 2 && (
                <Button size="xl" variant="outline" onClick={() => setSelecting(true)}>
                  <Link2 aria-hidden="true" />
                  {t('plans.editor.select')}
                </Button>
              )}
            </div>
          )}
    </div>
  )
}
