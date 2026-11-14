/*
 * "How to do it" in workout mode: a tap on the exercise's photo or name opens a
 * panel from the bottom with what its page in the library shows
 * (src/pages/ExerciseDetailPage.tsx): the photos of the start and end position,
 * the muscles, the steps, the description, the video. A panel rather than a
 * link to that page: the workout stays where it is, a swipe down or a tap
 * outside brings it back.
 *
 * Works offline: the exercise is the one kept in the workout
 * (`WorkoutExercise.exercise`, the library's JSON copied at Start, steps
 * and photos' addresses included), not asked of the server again. The
 * photos themselves need the network unless the browser has kept them.
 *
 * The same Sheet as the stepper's and the menu's (src/components/ui/sheet.tsx),
 * taller and scrolling inside: the steps can be long.
 */
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Exercise } from '@/api/exercises'
import { ExercisePhotos } from '@/components/exercises/ExercisePhotos'
import { MuscleChips } from '@/components/exercises/MuscleChips'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface ExerciseInfoSheetProps {
  /** Whether the panel is open. */
  open: boolean
  /** Called to close it (the X, a tap outside, Escape). */
  onOpenChange: (open: boolean) => void
  /** The exercise on screen, as kept in the workout. */
  exercise: Exercise
}

export function ExerciseInfoSheet({ open, onOpenChange, exercise }: ExerciseInfoSheetProps) {
  const { t } = useTranslation()
  const primary = exercise.muscles.filter(muscle => muscle.role === 'primary')
  const secondary = exercise.muscles.filter(muscle => muscle.role === 'secondary')
  const steps = exercise.instructions
  // Nothing to show but the name (a personal exercise saved bare): said in
  // words, not an empty panel
  const empty = exercise.photos.length === 0 && exercise.muscles.length === 0 && steps.length === 0 && !exercise.description && !exercise.youtube_url

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* The content scrolls, the title stays */}
      <SheetContent side="bottom" closeLabel={t('common.close')} className="max-h-[90dvh] rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="mx-auto w-full max-w-xl px-5 pb-0">
          <SheetTitle className="pr-10 font-heading text-xl font-extrabold">{exercise.name}</SheetTitle>
          {/* With its label: "None" alone would not say of what */}
          <SheetDescription>{`${t('exercises.detail.equipment')}: ${exercise.equipment?.name ?? t('exercises.detail.noEquipment')}`}</SheetDescription>
        </SheetHeader>

        {/* min-h-0, or the flex child cannot shrink and never scrolls */}
        <div className="mx-auto flex min-h-0 w-full max-w-xl flex-col gap-6 overflow-y-auto px-5 pb-2">
          {empty && <p className="text-muted-foreground">{t('workout.howTo.empty')}</p>}

          <ExercisePhotos photos={exercise.photos} name={exercise.name} />

          {primary.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">{t('exercises.detail.primaryMuscles')}</h3>
              <MuscleChips names={primary.map(muscle => muscle.name)} strong />
            </div>
          )}
          {secondary.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">{t('exercises.detail.secondaryMuscles')}</h3>
              <MuscleChips names={secondary.map(muscle => muscle.name)} />
            </div>
          )}

          {steps.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-heading text-lg font-extrabold">{t('exercises.detail.instructions')}</h3>
              <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-bold marker:text-primary">
                {steps.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </section>
          )}

          {exercise.description && (
            <section className="flex flex-col gap-3">
              <h3 className="font-heading text-lg font-extrabold">{t('exercises.detail.description')}</h3>
              {/* Keeps the line breaks the user typed */}
              <p className="whitespace-pre-line">{exercise.description}</p>
            </section>
          )}

          {/* A new tab: the workout keeps running meanwhile */}
          {exercise.youtube_url && (
            <a href={exercise.youtube_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-primary">
              <ExternalLink aria-hidden="true" className="size-4" />
              {t('exercises.detail.video')}
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
