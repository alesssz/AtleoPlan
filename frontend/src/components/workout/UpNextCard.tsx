/*
 * "Up next" under the exercise's sets: the exercise that follows (upNext(),
 * after the whole superset), with its photo and the plan's line, so the next
 * machine can be got ready during the rest.
 *
 * A reminder, not a button: moving on is the bottom bar's job, and a second
 * way out in the middle of the screen invites mis-taps. With nothing left,
 * no card: the bottom bar offers Finish workout.
 */
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WorkoutExercise } from './workout-session'

interface UpNextCardProps {
  /** The exercise that comes next. */
  item: WorkoutExercise
  /** What the plan asks of it, "3 × 12 · 60 s"; null for an exercise added on the way. */
  summary: string | null
}

export function UpNextCard({ item, summary }: UpNextCardProps) {
  const { t } = useTranslation()
  const cover = item.exercise.photos[0]

  return (
    // A named aside, so screen readers can find it. A dashed border and no
    // hover: a note, not something to tap
    <aside aria-label={t('workout.upNext')} className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed p-3">
      {cover
        ? <img src={cover.thumb_url} alt="" className="size-12 shrink-0 rounded-xl bg-muted object-cover" />
        : <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted"><Dumbbell className="size-5 text-muted-foreground" /></span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t('workout.upNext')}</p>
        <p className="truncate font-semibold">{item.exercise.name}</p>
        {summary && <p className="truncate text-sm text-muted-foreground tabular-nums">{summary}</p>}
      </div>
    </aside>
  )
}
