/*
 * The exercise editor, for a new exercise and for one of the user's own
 * (others are refused before trying: the backend would answer 403). After
 * saving, the next page replaces the editor in the history, so Back does not
 * reopen the form: the exercise's page, or after Create its edit page, at
 * the photos, which need the id the server has just given.
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCreateExercise, useExercise, useUpdateExercise, type Exercise } from '@/api/exercises'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExercisePhotoManager } from '@/components/exercises/ExercisePhotoManager'
import { emptyFormValues, formValuesFrom } from '@/components/exercises/exercise-form'
import { FormBanner } from '@/components/FormBanner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { shownData } from '@/lib/shown-data'

export function ExerciseEditorPage() {
  const { id } = useParams()
  return id === undefined ? <NewExercise /> : <EditExercise id={Number(id)} />
}

function useGoToExercise() {
  const navigate = useNavigate()
  return (exercise: Exercise) => void navigate(`/exercises/${exercise.id}`, { replace: true })
}

/** What Create leaves in the history entry of the edit page it opens. */
interface CreatedState {
  created: true
}

function useGoToPhotos() {
  const navigate = useNavigate()
  return (exercise: Exercise) => void navigate(`/exercises/${exercise.id}/edit`, { replace: true, state: { created: true } satisfies CreatedState })
}

/** `/exercises/new`: an empty form, or one with the name from `?name=`. */
function NewExercise() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const create = useCreateExercise()
  const goToPhotos = useGoToPhotos()

  return (
    <>
      {/* No eyebrow: the navigation already names the section */}
      <PageHeader title={t('exercises.editor.newTitle')} />
      <ExerciseForm
        defaultValues={emptyFormValues(searchParams.get('name') ?? '')}
        save={create.mutateAsync}
        onSaved={goToPhotos}
        submitLabel={t('exercises.editor.create')}
        cancelTo="/exercises"
      />
      <p className="mt-6 text-sm text-muted-foreground">{t('exercises.editor.photosLater')}</p>
    </>
  )
}

interface EditExerciseProps {
  id: number
}

/** `/exercises/:id/edit`: the exercise's values in the form, once loaded. */
function EditExercise({ id }: EditExerciseProps) {
  const { t, i18n } = useTranslation()
  const exercise = useExercise(id, i18n.language)
  const shown = shownData(exercise)
  const update = useUpdateExercise(id)
  const goToExercise = useGoToExercise()
  const created = (useLocation().state as Partial<CreatedState> | null)?.created === true
  // Once, when the photos appear: a callback ref made each render would
  // scroll back on every upload
  const scrollHere = useCallback((node: HTMLElement | null) => node?.scrollIntoView({ block: 'start' }), [])

  if (exercise.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <span className="sr-only">{t('exercises.loading')}</span>
      </div>
    )
  }

  // Not there, or not the user's: nothing to edit
  if (shown === undefined || !shown.is_mine) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>{shown === undefined ? t('exercises.detail.notFound') : t('exercises.editor.notMine')}</p>
        <Link to="/exercises" className="font-semibold text-primary">{t('exercises.detail.back')}</Link>
      </div>
    )
  }

  return (
    <>
      <PageHeader title={t('exercises.editor.editTitle')} />
      {/* Only with the data there: useForm() reads its defaultValues once.
          Keyed, so another exercise opened here starts a fresh form */}
      <ExerciseForm
        key={shown.id}
        defaultValues={formValuesFrom(shown)}
        save={update.mutateAsync}
        onSaved={goToExercise}
        submitLabel={t('exercises.editor.save')}
        cancelTo={`/exercises/${id}`}
      />
      <div ref={created ? scrollHere : undefined} className="mt-8 flex scroll-mt-4 flex-col gap-4">
        {created && <FormBanner variant="success">{t('exercises.editor.created')}</FormBanner>}
        <ExercisePhotoManager exercise={shown} />
        {/* The form's Cancel does the same, but is out of sight up there */}
        {created && (
          <Button asChild size="xl" className="self-start">
            <Link to={`/exercises/${id}`} replace>{t('exercises.editor.done')}</Link>
          </Button>
        )}
      </div>
    </>
  )
}
