/*
 * Import plan, on the plans' list (docs/design/D1-ui.md D1.4.6): a file
 * saved by a plan's Export (ExportPlanButton.tsx), here or on another
 * server, becomes a new plan; its page then opens, saying which exercises
 * had to be created. How it works: docs/concepts/C1-frontend.md C1.15.6.
 *
 * The file is chosen with the browser's own picker: an
 * `<input type="file">`, hidden, which the button clicks. Its text is read
 * in the browser (`file.text()`), parsed as JSON, and sent as the request's
 * body: the backend checks everything (ImportPlanRequest).
 */
import { Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useImportPlan } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'

/** What the import passes to the plan's page it opens, in the history entry's `state`. */
export interface PlanImportedState {
  /** The exercises the file had and this server did not, created as the user's own. */
  createdExercises: string[]
}

/** The Import plan button, with its error under it when the file is refused. */
export function ImportPlanButton() {
  // t() translates a key (react-i18next, docs/concepts/C1-frontend.md C1.7)
  const { t } = useTranslation()
  // A function that opens another page (React Router)
  const navigate = useNavigate()
  // The request that imports (TanStack Query's mutation, src/api/plans.ts)
  const importPlan = useImportPlan()
  // The hidden file input, clicked by the button. useRef: a box React
  // keeps between draws, here filled with the <input> element itself by
  // its `ref` attribute; changing it draws nothing again
  const input = useRef<HTMLInputElement>(null)
  // The message of the last failure; null when none
  const [error, setError] = useState<string | null>(null)

  /**
   * A file chosen: read, parsed, sent; the new plan's page opens.
   * @param event the input's change, with the file chosen
   */
  async function chosen(event: ChangeEvent<HTMLInputElement>) {
    // The file chosen: the first of the input's list (one, without
    // `multiple`); `?.`: undefined when the picker was closed with none
    const file = event.target.files?.[0]
    // Emptied, so that choosing the same file again fires a change too
    event.target.value = ''
    if (!file) return
    setError(null)

    // The file's content as data. `unknown`: any value at all, which
    // TypeScript lets through only as it is, here straight to the request.
    // `let`, not const: given its value inside the try below
    let content: unknown
    try {
      content = JSON.parse(await file.text())
    }
    catch {
      setError(t('plans.import.invalid'))
      return
    }

    try {
      // The new plan and the exercises created; mutateAsync(): the
      // mutation as a Promise, which throws when the request fails
      const imported = await importPlan.mutateAsync(content)
      // Its page, with the report in the history entry's state.
      // `satisfies`: TypeScript checks the object has the type's shape,
      // without changing the type it has
      void navigate(`/plans/${imported.plan.id}`, { state: { createdExercises: imported.createdExercises } satisfies PlanImportedState })
    }
    catch (failure) {
      // 422: JSON, but not a plan file this app reads; anything else: the
      // network or the server
      setError(failure instanceof ApiError && failure.status === 422 ? t('plans.import.invalid') : t('plans.import.failed'))
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {/* The browser's picker, hidden: the button below opens it. accept:
          the picker offers JSON files first */}
      <input ref={input} type="file" accept=".json,application/json" className="hidden" onChange={event => void chosen(event)} />
      {/* The button, outlined beside New plan; busy while sending */}
      <Button size="xl" variant="outline" disabled={importPlan.isPending} onClick={() => input.current?.click()}>
        <Upload aria-hidden="true" />
        {t('plans.import.button')}
      </Button>
      {/* Why the file was not imported, under the button */}
      {error !== null && <FormBanner variant="error">{error}</FormBanner>}
    </div>
  )
}
