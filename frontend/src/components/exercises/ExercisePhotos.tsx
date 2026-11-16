/*
 * The photos at the top of an exercise's page, side by side: imported
 * exercises have two, the start and the end position, so the movement reads
 * at a glance.
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
