/*
 * Finish with its confirmation, at both ends of workout mode and in
 * ResumeBanner. The same dialog offers Delete workout behind a second
 * question: both end the workout, so they share one door and the top bar gets
 * no extra button.
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

interface FinishButtonProps {
  /** The sets that count, done and in all, for the question. */
  count: SetCount
  /** The button's text: "Finish" at the top, "Finish workout" at the bottom. */
  label: string
  variant?: 'default' | 'outline'
  className?: string
  disabled: boolean
  onFinish: () => void
  /** Called when the user confirms deleting the workout instead; missing, the dialog offers no Delete. */
  onDiscard?: () => void
}

export function FinishButton({ count, label, variant = 'default', className, disabled, onFinish, onDiscard }: FinishButtonProps) {
  const { t } = useTranslation()
  // The sets not ticked, warm-ups excluded
  const left = count.total - count.done
  // Controlled, so closing it also brings back the first question
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'finish' | 'discard'>('finish')

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
                {/* With Delete offered, a column on every screen: three
                    buttons do not fit the dialog's 384 px in Spanish or
                    German */}
                <AlertDialogFooter className={cn(onDiscard && 'sm:flex-col-reverse')}>
                  {/* First in the code, so the reversed column shows it last,
                      away from the thumb. A Button, not an Action: it switches
                      to the second question instead of closing */}
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
                {/* The second question: nothing will be kept */}
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('workout.discardTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('workout.discardText')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button variant="outline" onClick={() => setView('finish')}>{t('workout.noteBack')}</Button>
                  <AlertDialogAction variant="destructive" onClick={onDiscard}>{t('workout.discardConfirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
