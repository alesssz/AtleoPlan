/*
 * One exercise (route `/exercises/:id`, docs/design/D1-ui.md D1.4.4): its
 * photos, equipment, logging type, muscles, instructions, description and
 * YouTube link; for the user's own exercise, Edit and Delete; for a public
 * one, Duplicate as mine, which opens the editor of the copy
 * (docs/concepts/C1-frontend.md C1.14.7).
 *
 * Not here yet, with the feature that brings them: "Add to plan" (UI-3),
 * the "My history" tab (FEAT-7), the videos (phase 2).
 */
import { ArrowLeft, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteExercise, useDuplicateExercise, useExercise, type Exercise } from '@/api/exercises'
import { ExercisePhotos } from '@/components/exercises/ExercisePhotos'
import { FormBanner } from '@/components/FormBanner'
import { PageHeader } from '@/components/PageHeader'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/http'

/** The exercise page (route `/exercises/:id`). */
export function ExerciseDetailPage() {
  const { t, i18n } = useTranslation()
  // The :id of the address, as a number; NaN when it is not one
  const id = Number(useParams().id)
  const exercise = useExercise(id, i18n.language)

  if (exercise.isPending) {
    // Loading: the photos' and the title's shapes
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-8/3 w-full rounded-2xl" />
        <span className="sr-only">{t('exercises.loading')}</span>
      </div>
    )
  }

  if (exercise.isError) {
    // 404 (no such exercise, or deleted) and 403 (someone else's): the same
    // message, since for the user both mean "not here". Any other error
    // offers to try again
    const missing = exercise.error instanceof ApiError && [403, 404].includes(exercise.error.status)
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>{missing ? t('exercises.detail.notFound') : t('exercises.loadError')}</p>
        {missing
          ? <Link to="/exercises" className="font-semibold text-primary">{t('exercises.detail.back')}</Link>
          : <Button variant="outline" onClick={() => void exercise.refetch()}>{t('server.retry')}</Button>}
      </div>
    )
  }

  // From here on the data is there; a component of its own keeps this one short
  return <ExerciseDetail exercise={exercise.data} />
}

/** Props of ExerciseDetail. */
interface ExerciseDetailProps {
  /** The exercise, loaded. */
  exercise: Exercise
}

/** The page's content, once the exercise has arrived. */
function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const { t } = useTranslation()
  // The muscles by role: the main ones, and those that help
  const primary = exercise.muscles.filter(muscle => muscle.role === 'primary')
  const secondary = exercise.muscles.filter(muscle => muscle.role === 'secondary')

  return (
    <>
      {/* Back to the plain list. The browser's Back button instead returns
          to the list as it was, filters included, since they live in that
          page's address */}
      <Link to="/exercises" className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('exercises.detail.back')}
      </Link>

      {/* No eyebrow: the tab bar and the sidebar already name the section
          (D1.5 "Page header", PageHeader.tsx) */}
      <PageHeader title={exercise.name} />

      <div className="flex flex-col gap-8">
        {/* The Mine badge and the owner's actions */}
        {exercise.is_mine && (
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t('exercises.mine')}</Badge>
            <Button asChild variant="outline" size="xl">
              <Link to={`/exercises/${exercise.id}/edit`}>
                <Pencil aria-hidden="true" />
                {t('exercises.detail.edit')}
              </Link>
            </Button>
            <DeleteExerciseButton exercise={exercise} />
          </div>
        )}

        {/* A public exercise: copy it as one's own, to change it */}
        {!exercise.is_mine && <DuplicateExerciseButton exercise={exercise} />}

        <ExercisePhotos photos={exercise.photos} name={exercise.name} />

        {/* The facts, as a description list: a term (dt) and its value (dd)
            per row, which screen readers read in pairs. Two columns from 640 px */}
        <dl className="grid gap-x-8 gap-y-4 rounded-3xl border bg-card/60 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">{t('exercises.detail.equipment')}</dt>
            <dd className="font-semibold">{exercise.equipment?.name ?? t('exercises.detail.noEquipment')}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t('exercises.detail.loggingType')}</dt>
            <dd className="font-semibold">{t(`exercises.logging.${exercise.logging_type}`)}</dd>
          </div>
          {primary.length > 0 && (
            <div>
              <dt className="text-sm text-muted-foreground">{t('exercises.detail.primaryMuscles')}</dt>
              <dd className="mt-1"><MuscleChips names={primary.map(muscle => muscle.name)} strong /></dd>
            </div>
          )}
          {secondary.length > 0 && (
            <div>
              <dt className="text-sm text-muted-foreground">{t('exercises.detail.secondaryMuscles')}</dt>
              <dd className="mt-1"><MuscleChips names={secondary.map(muscle => muscle.name)} /></dd>
            </div>
          )}
        </dl>

        {/* The steps, as a numbered list (<ol>), when there are some */}
        {exercise.instructions.length > 0 && (
          <section aria-labelledby="instructions-title">
            <h2 id="instructions-title" className="mb-3 font-heading text-lg font-extrabold tracking-tight">{t('exercises.detail.instructions')}</h2>
            {/* list-decimal draws 1. 2. 3.; pl-5 leaves room for them */}
            <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-bold marker:text-primary">
              {exercise.instructions.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
          </section>
        )}

        {exercise.description && (
          <section aria-labelledby="description-title">
            <h2 id="description-title" className="mb-3 font-heading text-lg font-extrabold tracking-tight">{t('exercises.detail.description')}</h2>
            {/* whitespace-pre-line keeps the line breaks the user typed */}
            <p className="whitespace-pre-line">{exercise.description}</p>
          </section>
        )}

        {/* The YouTube link opens in a new tab: target="_blank". rel="noreferrer"
            keeps the new page from reaching back into this one */}
        {exercise.youtube_url && (
          <a href={exercise.youtube_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 self-start font-semibold text-primary">
            <ExternalLink aria-hidden="true" className="size-4" />
            {t('exercises.detail.video')}
          </a>
        )}
      </div>
    </>
  )
}

/** Props of MuscleChips. */
interface MuscleChipsProps {
  /** The muscles' names. */
  names: string[]
  /** Lime chips for the main muscles; quieter ones otherwise. */
  strong?: boolean
}

/** Muscle names as rounded chips, wrapping on as many lines as needed. */
function MuscleChips({ names, strong = false }: MuscleChipsProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {names.map(name => (
        <li key={name}>
          <Badge variant={strong ? 'default' : 'secondary'} className="h-7 px-3 text-sm">{name}</Badge>
        </li>
      ))}
    </ul>
  )
}

/** Props of DuplicateExerciseButton. */
interface DuplicateExerciseButtonProps {
  /** The public exercise to copy. */
  exercise: Exercise
}

/**
 * Duplicate as mine (D1.4.4): asks the server for a copy, photos included,
 * then opens the copy's editor, where it can be changed at once.
 * `replace: false`: Back from the editor returns to the public exercise.
 */
function DuplicateExerciseButton({ exercise }: DuplicateExerciseButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const duplicate = useDuplicateExercise(exercise.id)

  return (
    <div className="flex flex-col items-start gap-3">
      {/* pending: a spinner in place of the icon while the copy is made */}
      <Button
        variant="outline"
        size="xl"
        pending={duplicate.isPending}
        onClick={() => duplicate.mutate(undefined, { onSuccess: copy => void navigate(`/exercises/${copy.id}/edit`) })}
      >
        <Copy aria-hidden="true" />
        {t('exercises.detail.duplicate')}
      </Button>
      {duplicate.isError && <FormBanner variant="error">{t('exercises.detail.duplicateError')}</FormBanner>}
    </div>
  )
}

/** Props of DeleteExerciseButton. */
interface DeleteExerciseButtonProps {
  /** The exercise to delete; the user's own. */
  exercise: Exercise
}

/**
 * Delete, with a confirmation first: deleting cannot be undone from the app
 * (D1.6). After it, the plain list.
 */
function DeleteExerciseButton({ exercise }: DeleteExerciseButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const remove = useDeleteExercise(exercise.id)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="xl">
          <Trash2 aria-hidden="true" />
          {t('exercises.detail.delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('exercises.detail.deleteTitle', { name: exercise.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('exercises.detail.deleteText')}</AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && <FormBanner variant="error">{t('exercises.detail.deleteError')}</FormBanner>}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('exercises.detail.cancel')}</AlertDialogCancel>
          {/* preventDefault() keeps the dialog open until the request is
              done: Radix's Action would close it at once. `replace: true`:
              Back does not return to the deleted exercise */}
          <AlertDialogAction
            variant="destructive"
            pending={remove.isPending}
            onClick={(event) => {
              event.preventDefault()
              remove.mutate(undefined, { onSuccess: () => void navigate('/exercises', { replace: true }) })
            }}
          >
            {t('exercises.detail.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
