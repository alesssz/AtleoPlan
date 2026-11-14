/*
 * The photos of an exercise, at the top of its page. Imported exercises have
 * two: the start and the end position, side by side so the movement reads at a
 * glance. Each is drawn from its large copy, `url` (at most 1600 px).
 *
 * A simpler start than the planned `ExerciseMedia` carousel, which will also
 * hold videos (phase 2) and the YouTube link.
 */
import { useTranslation } from 'react-i18next'
import type { ExercisePhoto } from '@/api/exercises'

interface ExercisePhotosProps {
  photos: ExercisePhoto[]
  /** For the photos' alt text. */
  name: string
}

export function ExercisePhotos({ photos, name }: ExercisePhotosProps) {
  const { t } = useTranslation()

  // No empty frame: the page starts with its text
  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => (
        <img
          key={photo.id}
          src={photo.url}
          alt={t('exercises.detail.photoAlt', { name, number: index + 1 })}
          className="aspect-4/3 w-full rounded-2xl bg-muted object-cover"
        />
      ))}
    </div>
  )
}
