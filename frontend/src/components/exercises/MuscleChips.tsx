/*
 * An exercise's muscles as rounded chips: lime for the main ones, quieter for
 * those that help. Shared by the exercise's page
 * (src/pages/ExerciseDetailPage.tsx) and by workout mode's "How to do it" panel
 * (src/components/workout/ExerciseInfoSheet.tsx), so the two look the same.
 */
import { Badge } from '@/components/ui/badge'

interface MuscleChipsProps {
  names: string[]
  strong?: boolean
}

export function MuscleChips({ names, strong = false }: MuscleChipsProps) {
  return (
    // A list, so screen readers say how many there are
    <ul className="flex flex-wrap gap-2">
      {names.map(name => (
        <li key={name}>
          <Badge variant={strong ? 'default' : 'secondary'} className="h-7 px-3 text-sm">{name}</Badge>
        </li>
      ))}
    </ul>
  )
}
