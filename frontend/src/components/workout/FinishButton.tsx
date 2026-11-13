/*
 * Finish, with a confirmation first: finishing cannot be undone. The question
 * says how many sets were done, and, when finishing early, that the sets not
 * ticked will not be saved (docs/design/D1-ui.md D1.4.9). Used by workout
 * mode, at the top ("Finish", outlined) and at the bottom ("Finish
 * workout", lime), and by the banner of a workout left open on Home and on
 * the plan's page (ResumeBanner). What finishing does is in
 * finish-workout.ts; this file is only the button and its question.
 *
 * Under the question, quieter and in red, **Delete workout**: the way to
 * throw away a workout in progress without finishing it first (a workout
 * started by mistake, or abandoned). The dialog then asks a second question,
 * since nothing will be kept, not even the sets ticked. Finishing and
 * deleting are both "ending the workout", so they share one door: the top
 * bar gets no extra button. How it works: docs/concepts/C1-frontend.md
 * C1.17.12.
 */
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SetCount } from './workout-session'

/** Props of FinishButton. */
interface FinishButtonProps {
  /** The sets that count, done and in all, for the question. */
  count: SetCount
  /** The button's text: "Finish" at the top, "Finish workout" at the bottom. */
  label: string
  /** The button's look: lime (default) or outlined. */
  variant?: 'default' | 'outline'
  /** Extra classes for the button: its padding or width. */
  className?: string
  /** True while finishing. */
  disabled: boolean
  /** Called when the user confirms. */
  onFinish: () => void
  /** Called when the user confirms deleting the workout instead; missing, the dialog offers no Delete. */
  onDiscard?: () => void
}

/**
 * Finish, with a confirmation: finishing cannot be undone from here. The
 * question says how many sets were done, and, when finishing early, that
 * the sets not ticked will not be saved. Below it, Delete workout, asked
 * again before anything is thrown away.
 */
export function FinishButton({ count, label, variant = 'default', className, disabled, onFinish, onDiscard }: FinishButtonProps) {
  const { t } = useTranslation()
  // The sets not ticked, warm-ups excluded
  const left = count.total - count.done
  // Whether the dialog is open: controlled here, so that closing it can
  // also bring it back to its first question
  const [open, setOpen] = useState(false)
  // Which question the dialog asks: finish, or delete
  const [view, setView] = useState<'finish' | 'discard'>('finish')

  /**
   * Opens or closes the dialog; closed, it goes back to the first question,
   * so the next time it opens on Finish again.
   * @param next true to open
   */
  function change(next: boolean) {
    setOpen(next)
    if (!next) setView('finish')
  }

  return (
    <AlertDialog open={open} onOpenChange={change}>
      <AlertDialogTrigger asChild>
        <Button size="xl" variant={variant} className={className} disabled={disabled}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {view === 'finish'
          ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('workout.finishTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('workout.finishText', { count: count.done, total: count.total })}
                    {left > 0 && ` ${t('workout.finishLeft', { count: left })}`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {/* The answers, in the footer, the dialog's grey band of
                    buttons. With Delete offered, a column on every screen
                    (`sm:flex-col-reverse` overrides the footer's row from
                    640 px): three buttons on one row did not fit the
                    dialog's 384 px in Spanish or German, and the column
                    is the phone's layout, already tried
                    (docs/how-to/H3-frontend.md H3.32.9). cn() joins
                    classes and, between two Tailwind classes for the same
                    property, keeps the later one: here ours over the
                    footer's `sm:flex-row`. `onDiscard && '…'` gives the
                    class only when Delete is offered (false adds nothing),
                    docs/concepts/C1-frontend.md C1.8 */}
                <AlertDialogFooter className={cn(onDiscard && 'sm:flex-col-reverse')}>
                  {/* Delete workout: inside the footer. After it, it fell
                      outside the box: the footer is the box's bottom edge
                      (negative margins, rounded bottom corners), so
                      anything after it hangs below the card. Plain red
                      text (ghost), first in the code: the footer is a
                      reversed column, so it shows last, under Keep going,
                      away from where the thumb goes to finish. A Button,
                      not an Action: it does not close the dialog, it turns
                      it into the second question */}
                  {onDiscard && (
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setView('discard')}>
                      <Trash2 aria-hidden="true" />
                      {t('workout.discard')}
                    </Button>
                  )}
                  <AlertDialogCancel>{t('workout.keepGoing')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onFinish}>{t('workout.finishConfirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </>
            )
          : (
              <>
                {/* The second question: nothing at all will be kept */}
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('workout.discardTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('workout.discardText')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  {/* Back to the first question, the dialog still open */}
                  <Button variant="outline" onClick={() => setView('finish')}>{t('workout.noteBack')}</Button>
                  <AlertDialogAction variant="destructive" onClick={onDiscard}>{t('workout.discardConfirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
