/*
 * One exercise (route `/exercises/:id`): its photos, equipment, logging type,
 * muscles, instructions, description and YouTube link; for the user's own
 * exercise, Edit and Delete; for a public one, Duplicate as mine, which opens
 * the editor of the copy.
 *
 * Not here yet, with the feature that brings them: "Add to plan", the "My
 * history" tab, the videos (phase 2).
 */
import { ArrowLeft, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { useDeleteExercise, useDuplicateExercise, useExercise, type Exercise } from '@/api/exercises'
import { ExercisePhotos } from '@/components/exercises/ExercisePhotos'
import { MuscleChips } from '@/components/exercises/MuscleChips'
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

export function ExerciseDetailPage() {
  const { t, i18n } = useTranslation()
  const id = Number(useParams().id)
  const exercise = useExercise(id, i18n.language)

  if (exercise.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-8/3 w-full rounded-2xl" />
        <span className="sr-only">{t('exercises.loading')}</span>
      </div>
    )
  }

  if (exercise.isError) {
    // 404 and 403 alike: for the user both mean "not here"
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

  return <ExerciseDetail exercise={exercise.data} />
}

interface ExerciseDetailProps {
  /** The exercise, loaded. */
  exercise: Exercise
}

function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const { t } = useTranslation()
  const primary = exercise.muscles.filter(muscle => muscle.role === 'primary')
  const secondary = exercise.muscles.filter(muscle => muscle.role === 'secondary')

  return (
    <>
      {/* The plain list; the browser's Back returns to it with its filters */}
      <Link to="/exercises" className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('exercises.detail.back')}
      </Link>

      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={exercise.name} />

      <div className="flex flex-col gap-8">
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

        {!exercise.is_mine && <DuplicateExerciseButton exercise={exercise} />}

        <ExercisePhotos photos={exercise.photos} name={exercise.name} />

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

        {exercise.instructions.length > 0 && (
          <section aria-labelledby="instructions-title">
            <h2 id="instructions-title" className="mb-3 font-heading text-lg font-extrabold tracking-tight">{t('exercises.detail.instructions')}</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-bold marker:text-primary">
              {exercise.instructions.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
          </section>
        )}

        {exercise.description && (
          <section aria-labelledby="description-title">
            <h2 id="description-title" className="mb-3 font-heading text-lg font-extrabold tracking-tight">{t('exercises.detail.description')}</h2>
            {/* Keeps the line breaks the user typed */}
            <p className="whitespace-pre-line">{exercise.description}</p>
          </section>
        )}

        {/* noreferrer: the new page gets no handle on this one */}
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

interface DuplicateExerciseButtonProps {
  exercise: Exercise
}

/**
 * Duplicate as mine: asks the server for a copy, photos included, then opens
 * the copy's editor. Back from the editor returns to the public exercise.
 */
function DuplicateExerciseButton({ exercise }: DuplicateExerciseButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const duplicate = useDuplicateExercise(exercise.id)

  return (
    <div className="flex flex-col items-start gap-3">
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

interface DeleteExerciseButtonProps {
  exercise: Exercise
}

/**
 * Delete, with a confirmation first: deleting cannot be undone from the app.
 * After it, the plain list.
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
          {/* Open until the request is done: Radix's Action would close it
              at once. Back must not return to the deleted exercise */}
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
