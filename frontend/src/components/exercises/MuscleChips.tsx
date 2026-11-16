/*
 * An exercise's muscles as chips, shared by the exercise's page and workout
 * mode's "How to do it" panel; `strong` (lime) for the primary ones.
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
