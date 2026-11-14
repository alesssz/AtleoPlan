/*
 * One row of the exercise library: the cover photo, the name, the main muscle
 * and, for the user's own exercises, the Mine badge.
 */
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Exercise } from '@/api/exercises'
import { Badge } from '@/components/ui/badge'

interface ExerciseListItemProps {
  /** The exercise to show, as the list's API sends it. */
  exercise: Exercise
}

export function ExerciseListItem({ exercise }: ExerciseListItemProps) {
  const { t } = useTranslation()
  // The 400 px copy, not the full photo
  const cover = exercise.photos[0]
  // The API sends the primary muscles first
  const mainMuscle = exercise.muscles.find(muscle => muscle.role === 'primary')

  return (
    <Link
      to={`/exercises/${exercise.id}`}
      className="flex items-center gap-4 rounded-2xl border bg-card/60 p-3 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {/* Decorative: the name says the same. Lazy, so a long list does not
          download every photo at once */}
      {cover
        ? <img src={cover.thumb_url} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl bg-muted object-cover" />
        : (
            <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted">
              <Dumbbell className="size-6 text-muted-foreground" />
            </div>
          )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{exercise.name}</p>
        {mainMuscle && <p className="truncate text-sm text-muted-foreground">{mainMuscle.name}</p>}
      </div>

      {exercise.is_mine && <Badge>{t('exercises.mine')}</Badge>}
    </Link>
  )
}
