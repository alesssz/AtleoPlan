/*
 * The photos of an exercise, at the top of its page (docs/design/D1-ui.md
 * D1.4.4). Imported exercises have two: the start and the end position, side
 * by side so the movement reads at a glance. Each is drawn from its large
 * copy, `url` (at most 1600 px, docs/concepts/C1-frontend.md C1.14.5).
 *
 * A simpler start than D1.5's `ExerciseMedia` carousel, which will also hold
 * videos (phase 2) and the YouTube link.
 */
import { useTranslation } from 'react-i18next'
import type { ExercisePhoto } from '@/api/exercises'

/** Props of ExercisePhotos. */
interface ExercisePhotosProps {
  /** The photos, in order. */
  photos: ExercisePhoto[]
  /** The exercise's name, for the photos' text alternative. */
  name: string
}

/** The photos in a grid of two columns; nothing at all when there are none. */
export function ExercisePhotos({ photos, name }: ExercisePhotosProps) {
  const { t } = useTranslation()

  // No photos: no empty frame, the page starts with its text
  if (photos.length === 0) return null

  return (
    // Two columns, each photo 4:3 and cropped to fill its box; the second
    // argument of map() is the item's position, 0 for the first
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => (
        <img
          key={photo.id}
          src={photo.url}
          // "Barbell Bench Press, photo 1": a screen reader says which is which
          alt={t('exercises.detail.photoAlt', { name, number: index + 1 })}
          className="aspect-4/3 w-full rounded-2xl bg-muted object-cover"
        />
      ))}
    </div>
  )
}
