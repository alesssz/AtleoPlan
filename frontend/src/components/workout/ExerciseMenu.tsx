/*
 * The exercise's menu in workout mode (docs/design/D1-ui.md D1.4.9): a "⋯"
 * beside the exercise's name, opening a panel from the bottom with four
 * actions, each a row 48 px tall:
 *
 * - **Swap exercise**: the library's picker, filtered by the exercise's
 *   main muscle, opens (WorkoutScreen); only before a set is ticked;
 * - **Skip exercise**, or **Do it after all** once skipped;
 * - **Add a note** (or **Edit the note**): the panel turns into a text box;
 *   the note goes with the workout, on that exercise;
 * - **Watch the video**, when the exercise has one: YouTube, in a new tab.
 *
 * A panel from the bottom rather than a small drop-down menu: rows as wide
 * as the phone are easy to hit mid-workout, and it is the same Sheet as the
 * stepper's (src/components/ui/sheet.tsx). How it works:
 * docs/concepts/C1-frontend.md C1.17.7.
 */
import { ArrowLeftRight, CirclePlay, Ellipsis, NotebookPen, SkipForward, Undo2 } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { WorkoutExercise } from './workout-session'

/** The longest note the backend takes on an exercise (SaveSessionRequest: max:500). */
const NOTE_MAX = 500

/** The classes of the menu's rows: as wide as the panel, text on the left. */
const ROW = 'w-full justify-start px-3 text-base'

/** Props of ExerciseMenu. */
interface ExerciseMenuProps {
  /** The exercise on screen. */
  item: WorkoutExercise
  /** Swap: the panel closes and the picker opens. */
  onSwap: () => void
  /** Skip (true), or take the skip back (false). */
  onSkip: (skipped: boolean) => void
  /** The note, as written. */
  onSaveNote: (notes: string) => void
}

/** The "⋯" button and the panel it opens. */
export function ExerciseMenu({ item, onSwap, onSkip, onSaveNote }: ExerciseMenuProps) {
  const { t } = useTranslation()
  // Whether the panel is open, controlled here so the actions can close it
  const [open, setOpen] = useState(false)
  // What the panel shows: the four actions, or the note's text box
  const [view, setView] = useState<'menu' | 'note'>('menu')
  // The note while it is written; kept by Save only
  const [draft, setDraft] = useState('')
  // Links the note's label to its text box
  const noteId = useId()
  // A set already ticked: the exercise can no longer be swapped
  const started = item.sets.some(set => set.done)

  /**
   * Opens or closes the panel; closed, it goes back to the four actions.
   * @param next true to open
   */
  function change(next: boolean) {
    setOpen(next)
    if (!next) setView('menu')
  }

  /**
   * Runs an action and closes the panel.
   * @param action what the row does
   */
  function act(action: () => void) {
    change(false)
    action()
  }

  return (
    <Sheet open={open} onOpenChange={change}>
      {/* "⋯", 48 px, named after the exercise for screen readers */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-xl" aria-label={t('workout.menu', { name: item.exercise.name })} className="shrink-0">
          <Ellipsis aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel={t('common.close')} className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-5">
          <SheetHeader className="px-0 pb-1">
            <SheetTitle className="font-heading text-xl font-extrabold">{item.exercise.name}</SheetTitle>
            {/* Radix asks every dialog for a description; hidden here, the
                title says enough */}
            <SheetDescription className="sr-only">{t('workout.menuText')}</SheetDescription>
          </SheetHeader>

          {view === 'menu' && (
            <>
              {/* Swap; disabled once a set is ticked, saying why */}
              <div>
                <Button variant="ghost" size="xl" className={ROW} disabled={started} onClick={() => act(onSwap)}>
                  <ArrowLeftRight aria-hidden="true" />
                  {t('workout.swap')}
                </Button>
                {started && <p className="px-3 text-sm text-muted-foreground">{t('workout.swapLocked')}</p>}
              </div>

              {/* Skip, or take it back */}
              <Button variant="ghost" size="xl" className={ROW} onClick={() => act(() => onSkip(!item.skipped))}>
                {item.skipped ? <Undo2 aria-hidden="true" /> : <SkipForward aria-hidden="true" />}
                {item.skipped ? t('workout.unskip') : t('workout.skip')}
              </Button>

              {/* The note: the panel turns into its text box */}
              <Button
                variant="ghost"
                size="xl"
                className={ROW}
                onClick={() => {
                  setDraft(item.notes ?? '')
                  setView('note')
                }}
              >
                <NotebookPen aria-hidden="true" />
                {item.notes ? t('workout.editNote') : t('workout.addNote')}
              </Button>

              {/* The video, only when there is one: a link that looks like
                  a row (Button asChild, C1.8), opening YouTube in a new tab.
                  rel="noreferrer": the new tab gets no handle on this page */}
              {item.exercise.youtube_url && (
                <Button asChild variant="ghost" size="xl" className={ROW}>
                  <a href={item.exercise.youtube_url} target="_blank" rel="noreferrer" onClick={() => change(false)}>
                    <CirclePlay aria-hidden="true" />
                    {t('workout.video')}
                  </a>
                </Button>
              )}
            </>
          )}

          {view === 'note' && (
            <>
              <Label htmlFor={noteId}>{t('workout.noteLabel')}</Label>
              <Textarea
                id={noteId}
                value={draft}
                maxLength={NOTE_MAX}
                rows={3}
                placeholder={t('workout.notePlaceholder')}
                onChange={event => setDraft(event.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <Button size="xl" onClick={() => act(() => onSaveNote(draft))}>{t('workout.noteSave')}</Button>
                <Button variant="outline" size="xl" onClick={() => setView('menu')}>{t('workout.noteBack')}</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
