/*
 * "Up next" in workout mode (docs/design/D1-ui.md D1.4.9): a reminder under
 * the exercise's sets naming the exercise that comes after it, with its
 * photo and what the plan asks ("3 × 12 · 60 s"), so the next machine or
 * the next weights can be got ready during the rest.
 *
 * Only a reminder, not a button: moving on is the bottom bar's job (Next,
 * or the superset's next exercise by name), and a second way to leave the
 * exercise, in the middle of the screen, was asked to be removed after it
 * was tried in a workout (docs/how-to/H3-frontend.md H3.32.6).
 *
 * Which exercise: upNext() in workout-session.ts, the first one after this
 * one (after its whole superset) with sets left to do. The screen draws no
 * card when there is none: the bottom bar then offers Finish workout.
 */
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WorkoutExercise } from './workout-session'

/** Props of UpNextCard. */
interface UpNextCardProps {
  /** The exercise that comes next. */
  item: WorkoutExercise
  /** What the plan asks of it, "3 × 12 · 60 s"; null for an exercise added on the way. */
  summary: string | null
}

/** The reminder naming the next exercise. */
export function UpNextCard({ item, summary }: UpNextCardProps) {
  const { t } = useTranslation()
  // Its first photo, from the small copy, as the exercise's own at the top
  const cover = item.exercise.photos[0]

  return (
    // <aside>: content beside the main one, a reminder. Named "Up next"
    // (aria-label), it becomes a region screen readers can find by name.
    // A dashed border and no hover: a note, not something to tap
    <aside aria-label={t('workout.upNext')} className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed p-3">
      {cover
        ? <img src={cover.thumb_url} alt="" className="size-12 shrink-0 rounded-xl bg-muted object-cover" />
        : <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted"><Dumbbell className="size-5 text-muted-foreground" /></span>}
      <div className="min-w-0 flex-1">
        {/* A small title, as the column titles above the sets */}
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t('workout.upNext')}</p>
        <p className="truncate font-semibold">{item.exercise.name}</p>
        {summary && <p className="truncate text-sm text-muted-foreground tabular-nums">{summary}</p>}
      </div>
    </aside>
  )
}
