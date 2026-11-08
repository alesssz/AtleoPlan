/*
 * One past workout (route `/progress/history/:id`, docs/design/D1-ui.md
 * D1.4.11): when, which day of which plan, its four numbers, how it felt and
 * the notes, then every exercise against the last time it was done before
 * this workout (compare.ts), with its sets. **Delete workout**, with a question first.
 *
 * Read from the server (GET /api/sessions/{id}, useSession): it may come
 * from another phone. Editing a workout's sets is not here yet: backlog
 * FEAT-6. How it works: docs/concepts/C1-frontend.md C1.19.
 */
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useDeleteSession, useSession, type SessionWithLastSets } from '@/api/sessions'
import { FormBanner } from '@/components/FormBanner'
import { feelingName } from '@/components/history/feeling'
import { SessionExercises } from '@/components/history/SessionExercises'
import { compareWorkout, countVerdicts } from '@/components/history/compare'
import { ComparisonSummary } from '@/components/history/ComparisonSummary'
import { sessionTotals } from '@/components/history/totals'
import { WorkoutStats } from '@/components/history/WorkoutStats'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/http'

/** The workout's page (route `/progress/history/:id`). */
export function HistoryDetailPage() {
  const { t, i18n } = useTranslation()
  // The :id of the address; '' when missing, which the route never is
  const id = useParams().id ?? ''
  const workout = useSession(id, i18n.language)

  if (workout.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <span className="sr-only">{t('history.loadingOne')}</span>
      </div>
    )
  }

  if (workout.isError) {
    // 404: deleted, never sent, or someone else's (the backend answers 403
    // for that: both mean "not here" to the user)
    const missing = workout.error instanceof ApiError && [403, 404].includes(workout.error.status)
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>{missing ? t('history.notFound') : t('history.loadError')}</p>
        {missing
          ? <Link to="/progress/history" className="font-semibold text-primary">{t('history.back')}</Link>
          : <Button variant="outline" size="xl" onClick={() => void workout.refetch()}>{t('server.retry')}</Button>}
      </div>
    )
  }

  return <WorkoutDetail data={workout.data} />
}

/** Props of WorkoutDetail. */
interface WorkoutDetailProps {
  /** The workout and last time for each of its exercises. */
  data: SessionWithLastSets
}

/** The page's content, once the workout has arrived. */
function WorkoutDetail({ data }: WorkoutDetailProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const unit = user?.weight_unit ?? 'kg'
  const { session, lastSets } = data
  const remove = useDeleteSession(session.id)
  const totals = sessionTotals(session)
  // Each exercise against the last time it was done before this workout
  const comparisons = compareWorkout(session.exercises, lastSets)
  // "Tuesday 3 November 2026 · 18:05": the day in full and the time it started
  const started = new Date(session.started_at)
  const when = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(started)

  return (
    <>
      <Link to="/progress/history" className="mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('history.back')}
      </Link>
      <PageHeader eyebrow={when} title={session.day_name ?? t('workout.free')} description={session.plan_name ?? undefined} />

      <div className="flex flex-col gap-8">
        <section aria-labelledby="workout-numbers" className="flex flex-col gap-4">
          <h2 id="workout-numbers" className="sr-only">{t('summary.numbersTitle')}</h2>
          <WorkoutStats totals={totals} />
          <ComparisonSummary count={countVerdicts(comparisons)} />
        </section>

        {/* How it felt and the notes, when the summary was answered */}
        {(session.feeling || session.notes) && (
          <section aria-labelledby="workout-notes" className="flex flex-col gap-2 rounded-2xl border bg-card/60 p-5">
            <h2 id="workout-notes" className="sr-only">{t('summary.notesLabel')}</h2>
            {session.feeling && (
              <p className="font-semibold">{t('history.felt', { feeling: feelingName(session.feeling, t), value: session.feeling })}</p>
            )}
            {session.notes && <p className="whitespace-pre-line text-muted-foreground">{session.notes}</p>}
          </section>
        )}

        <section aria-labelledby="workout-exercises">
          <h2 id="workout-exercises" className="mb-3 font-heading text-lg font-extrabold tracking-tight">{t('history.exercisesTitle')}</h2>
          <SessionExercises exercises={session.exercises} comparisons={comparisons} unit={unit} />
        </section>

        {/* Delete, with a question first: it cannot be undone */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="xl" className="self-start text-destructive">
              <Trash2 aria-hidden="true" />
              {t('summary.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('summary.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('summary.deleteText')}</AlertDialogDescription>
            </AlertDialogHeader>
            {/* Inside the window, which stays open when the request fails */}
            {remove.isError && <FormBanner variant="error">{t('summary.deleteError')}</FormBanner>}
            <AlertDialogFooter>
              <AlertDialogCancel>{t('summary.keep')}</AlertDialogCancel>
              {/* preventDefault() keeps the dialog open until the request
                  is done (as on the plan's page); `replace`: Back does not
                  return to a deleted workout */}
              <AlertDialogAction
                variant="destructive"
                disabled={remove.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  remove.mutate(undefined, { onSuccess: () => void navigate('/progress/history', { replace: true }) })
                }}
              >
                {t('summary.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
