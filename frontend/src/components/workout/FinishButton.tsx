/*
 * Finish, with a confirmation first: finishing cannot be undone. The question
 * says how many sets were done, and, when finishing early, that the sets not
 * ticked will not be saved (docs/design/D1-ui.md D1.4.9). Used by workout
 * mode, at the top ("Finish", outlined) and at the bottom ("Finish
 * workout", lime), and by the banner of a workout left open on Home and on
 * the plan's page (ResumeBanner). What finishing does is in
 * finish-workout.ts; this file is only the button and its question.
 */
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
}

/**
 * Finish, with a confirmation: finishing cannot be undone from here. The
 * question says how many sets were done, and, when finishing early, that
 * the sets not ticked will not be saved.
 */
export function FinishButton({ count, label, variant = 'default', className, disabled, onFinish }: FinishButtonProps) {
  const { t } = useTranslation()
  // The sets not ticked, warm-ups excluded
  const left = count.total - count.done

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="xl" variant={variant} className={className} disabled={disabled}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('workout.finishTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('workout.finishText', { count: count.done, total: count.total })}
            {left > 0 && ` ${t('workout.finishLeft', { count: left })}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('workout.keepGoing')}</AlertDialogCancel>
          <AlertDialogAction onClick={onFinish}>{t('workout.finishConfirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
