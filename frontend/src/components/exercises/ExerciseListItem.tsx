/*
 * One row of the exercise library (docs/design/D1-ui.md D1.4.3, the
 * `ExerciseListItem` of D1.5): the cover photo, the name, the main muscle and,
 * for the user's own exercises, the Mine badge. The whole row is a link to
 * the exercise's page. The plan editor will reuse it with a checkbox (FEAT-2).
 */
import { Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Exercise } from '@/api/exercises'
import { Badge } from '@/components/ui/badge'

/** Props of ExerciseListItem. */
interface ExerciseListItemProps {
  /** The exercise to show, as the list's API sends it. */
  exercise: Exercise
}

/** A row of the library, linking to the exercise. */
export function ExerciseListItem({ exercise }: ExerciseListItemProps) {
  const { t } = useTranslation()
  // The first photo is the cover; undefined when there is none
  const cover = exercise.photos[0]
  // The first primary muscle, the one the row names; the API sends them first
  const mainMuscle = exercise.muscles.find(muscle => muscle.role === 'primary')

  return (
    // A link that looks like a card: 80 px tall, comfortably over the 48 px
    // a finger needs (D1.5). min-w-0 below lets a long name be cut with "…"
    <Link
      to={`/exercises/${exercise.id}`}
      className="flex items-center gap-4 rounded-2xl border bg-card/60 p-3 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {/* The cover: a 56 px square, cropped to fill it (object-cover).
          alt="": decorative, since the name next to it says the same.
          loading="lazy": the browser loads it only when the row comes near
          the screen, so a long list does not download every photo at once */}
      {cover
        ? <img src={cover.url} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl bg-muted object-cover" />
        : (
            // No photo: a muted tile with a dumbbell, the same size
            <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted">
              <Dumbbell className="size-6 text-muted-foreground" />
            </div>
          )}

      {/* Name and main muscle, each on one line, cut with "…" when too long */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{exercise.name}</p>
        {mainMuscle && <p className="truncate text-sm text-muted-foreground">{mainMuscle.name}</p>}
      </div>

      {/* Mine: the user's own exercise (is_mine, from the backend) */}
      {exercise.is_mine && <Badge>{t('exercises.mine')}</Badge>}
    </Link>
  )
}
