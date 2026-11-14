/*
 * Import plan, in the header of the plans' list, beside New plan; only its icon
 * on phones: a file saved by a plan's Export (ExportPlanButton.tsx), here or on
 * another server, becomes a new plan; its page then opens, saying which
 * exercises had to be created.
 *
 * In a window, in three steps, so that nothing is sent by surprise:
 * 1. **What is expected,** in words: a file made by Export, ending in
 *    `.atleoplan.json`; the plan arrives as a new one, nothing changes.
 * 2. **Choose file:** the browser's own picker, an `<input type="file">`,
 *    hidden, which the button clicks. The file is read in the browser
 *    (`file.text()`) and looked at (plan-file.ts): too big, not JSON, not
 *    a plan, a plan of a later version are said at once, and nothing is
 *    sent.
 * 3. **The preview,** "Calisthenics · 3 days · 23 exercises", and Import,
 *    which sends it. The backend checks every field (ImportPlanRequest)
 *    and may still refuse it.
 */
import { FileJson, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useImportPlan } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ApiError } from '@/lib/http'
import { MAX_PLAN_FILE_BYTES, readPlanFile, type PlanFileSummary } from './plan-file'

/** What the import passes to the plan's page it opens, in the history entry's `state`. */
export interface PlanImportedState {
  /** The exercises the file had and this server did not, created as the user's own. */
  createdExercises: string[]
}

/** A file chosen and read as a plan: what the preview shows, and what Import sends. */
interface ChosenFile {
  fileName: string
  summary: PlanFileSummary
  /** Sent as it is. */
  content: unknown
}

export function ImportPlanButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const importPlan = useImportPlan()
  // The hidden file input, clicked by Choose file
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<ChosenFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * The window opened or closed. Closing forgets the file and the
   * message: the next time starts from step 1.
   * @param next true when opening
   */
  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) {
      setChosen(null)
      setError(null)
    }
  }

  /**
   * A file chosen: read and looked at, in the browser. Nothing is sent.
   * @param event the input's change, with the file chosen
   */
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Emptied, so that choosing the same file again fires a change too
    event.target.value = ''
    if (!file) return
    setChosen(null)
    setError(null)

    // One too big is not even read: its size says enough
    const text = file.size <= MAX_PLAN_FILE_BYTES ? await file.text() : ''
    const reading = readPlanFile(text, file.size)
    if (reading.ok) setChosen({ fileName: file.name, summary: reading.summary, content: reading.content })
    else setError(t(`plans.import.problems.${reading.problem}`))
  }

  /** Import: sends the file; the new plan's page opens. */
  async function send() {
    if (!chosen) return
    setError(null)
    try {
      const imported = await importPlan.mutateAsync(chosen.content)
      // The report travels in the history entry's state
      void navigate(`/plans/${imported.plan.id}`, { state: { createdExercises: imported.createdExercises } satisfies PlanImportedState })
    }
    catch (failure) {
      // 422: a plan file in its shape, but some value the backend refuses
      // (edited by hand, say); anything else: the network or the server
      setError(failure instanceof ApiError && failure.status === 422 ? t('plans.import.refused') : t('plans.import.failed'))
    }
  }

  return (
    // Controlled, so closing can also reset the window
    <Dialog open={open} onOpenChange={changeOpen}>
      {/* Icon only on phones, to fit the title's row; the text stays for
          screen readers and as a tooltip */}
      <DialogTrigger asChild>
        <Button size="xl" variant="outline" title={t('plans.import.button')} className="max-sm:w-12 max-sm:px-0">
          <Upload aria-hidden="true" />
          <span className="max-sm:sr-only">{t('plans.import.button')}</span>
        </Button>
      </DialogTrigger>

      <DialogContent closeLabel={t('common.close')} className="flex flex-col gap-4 sm:max-w-lg">
        {/* Step 1: what file is expected, and what happens */}
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold">{t('plans.import.title')}</DialogTitle>
          <DialogDescription>{t('plans.import.description')}</DialogDescription>
        </DialogHeader>

        <input ref={input} type="file" accept=".json,application/json" className="hidden" onChange={event => void choose(event)} />

        {/* Step 3: the preview of the file chosen and read */}
        {chosen && (
          <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
            <FileJson aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-semibold break-words">{chosen.summary.name}</p>
              <p className="text-sm text-muted-foreground">
                {t('plans.import.summary', { days: t('plans.days', { count: chosen.summary.days }), count: chosen.summary.items })}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{chosen.fileName}</p>
            </div>
          </div>
        )}

        {error !== null && <FormBanner variant="error">{error}</FormBanner>}

        {/* The footer is a reversed column on a phone: the lime button,
            first here, is the lowest, under the thumb */}
        <DialogFooter className="gap-3 sm:justify-start">
          {chosen
            ? (
                <>
                  <Button size="xl" pending={importPlan.isPending} onClick={() => void send()}>
                    <Upload aria-hidden="true" />
                    {t('plans.import.confirm')}
                  </Button>
                  <Button size="xl" variant="outline" disabled={importPlan.isPending} onClick={() => input.current?.click()}>
                    {t('plans.import.chooseAnother')}
                  </Button>
                </>
              )
            : (
                <Button size="xl" onClick={() => input.current?.click()}>
                  <FileJson aria-hidden="true" />
                  {t('plans.import.choose')}
                </Button>
              )}
          <DialogClose asChild>
            <Button size="xl" variant="ghost">{t('plans.import.cancel')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
