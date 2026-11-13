/*
 * The exercise editor (routes `/exercises/new` and `/exercises/:id/edit`,
 * docs/design/D1-ui.md D1.4.5): one page for both, with the form of
 * src/components/exercises/ExerciseForm.tsx.
 *
 * - **New:** an empty form; `?name=…` in the address fills in the name, as
 *   the library's "Create «…»" does after a search with no result.
 * - **Edit:** the exercise is loaded first, then the form starts from its
 *   values. Only the user's own exercises: the backend refuses the others
 *   with a 403 anyway (ExercisePolicy), the page says so before trying.
 *   Under the form, its photos (ExercisePhotoManager), saved one change at
 *   a time; on a new exercise, a line says they come after Create.
 *
 * After saving, the exercise's page; `replace: true` so that Back from there
 * does not reopen the form.
 */
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCreateExercise, useExercise, useUpdateExercise, type Exercise } from '@/api/exercises'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExercisePhotoManager } from '@/components/exercises/ExercisePhotoManager'
import { emptyFormValues, formValuesFrom } from '@/components/exercises/exercise-form'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

/** The editor page: new when the address has no id, edit otherwise. */
export function ExerciseEditorPage() {
  // The :id of /exercises/:id/edit; undefined on /exercises/new
  const { id } = useParams()
  return id === undefined ? <NewExercise /> : <EditExercise id={Number(id)} />
}

/** Goes to a saved exercise's page, replacing the editor in the history. */
function useGoToExercise() {
  const navigate = useNavigate()
  return (exercise: Exercise) => void navigate(`/exercises/${exercise.id}`, { replace: true })
}

/** `/exercises/new`: an empty form, or one with the name from `?name=`. */
function NewExercise() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const create = useCreateExercise()
  const goToExercise = useGoToExercise()

  return (
    <>
      {/* No eyebrow: the tab bar and the sidebar already name the section
          (D1.5 "Page header", PageHeader.tsx) */}
      <PageHeader title={t('exercises.editor.newTitle')} />
      <ExerciseForm
        defaultValues={emptyFormValues(searchParams.get('name') ?? '')}
        // mutateAsync(): like mutate(), but returns a Promise of the answer,
        // which the form awaits (and catches, for the 422 messages)
        save={create.mutateAsync}
        onSaved={goToExercise}
        submitLabel={t('exercises.editor.create')}
        cancelTo="/exercises"
      />
      {/* Photos need the exercise's id, which the server gives at Create:
          they are added from Edit afterwards (C1.14.7) */}
      <p className="mt-6 text-sm text-muted-foreground">{t('exercises.editor.photosLater')}</p>
    </>
  )
}

/** Props of EditExercise. */
interface EditExerciseProps {
  /** The exercise's number, from the address. */
  id: number
}

/** `/exercises/:id/edit`: the exercise's values in the form, once loaded. */
function EditExercise({ id }: EditExerciseProps) {
  const { t, i18n } = useTranslation()
  const exercise = useExercise(id, i18n.language)
  const update = useUpdateExercise(id)
  const goToExercise = useGoToExercise()

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
  if (exercise.isError || !exercise.data.is_mine) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>{exercise.isError ? t('exercises.detail.notFound') : t('exercises.editor.notMine')}</p>
        <Link to="/exercises" className="font-semibold text-primary">{t('exercises.detail.back')}</Link>
      </div>
    )
  }

  return (
    <>
      <PageHeader title={t('exercises.editor.editTitle')} />
      {/* The form is drawn only now, with the data there: useForm() reads its
          defaultValues once, when the form first appears. `key` makes React
          start a fresh form if another exercise is opened in the same place */}
      <ExerciseForm
        key={exercise.data.id}
        defaultValues={formValuesFrom(exercise.data)}
        save={update.mutateAsync}
        onSaved={goToExercise}
        submitLabel={t('exercises.editor.save')}
        cancelTo={`/exercises/${id}`}
      />
      {/* The photos, under the form and apart from it: each change is sent
          at once, not with Save (C1.14.7) */}
      <div className="mt-8">
        <ExercisePhotoManager exercise={exercise.data} />
      </div>
    </>
  )
}
