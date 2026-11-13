/*
 * An exercise's muscles as rounded chips (docs/design/D1-ui.md D1.4.4):
 * lime for the main ones, quieter for those that help. Shared by the
 * exercise's page (src/pages/ExerciseDetailPage.tsx) and by workout mode's
 * "How to do it" panel (src/components/workout/ExerciseInfoSheet.tsx), so
 * the two look the same.
 */
import { Badge } from '@/components/ui/badge'

/** Props of MuscleChips. */
interface MuscleChipsProps {
  /** The muscles' names. */
  names: string[]
  /** Lime chips for the main muscles; quieter ones otherwise. */
  strong?: boolean
}

/** Muscle names as rounded chips, wrapping on as many lines as needed. */
export function MuscleChips({ names, strong = false }: MuscleChipsProps) {
  return (
    // A list: screen readers say how many muscles there are. map() draws
    // one chip per name; `key`, the name itself, lets React tell the
    // chips apart when the list changes (docs/concepts/C1-frontend.md C1.4)
    <ul className="flex flex-wrap gap-2">
      {names.map(name => (
        <li key={name}>
          <Badge variant={strong ? 'default' : 'secondary'} className="h-7 px-3 text-sm">{name}</Badge>
        </li>
      ))}
    </ul>
  )
}
