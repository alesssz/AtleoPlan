/*
 * Export, on a plan's page (docs/design/D1-ui.md D1.4.7): the plan saved as
 * a file, `<name>.atleoplan.json`, to import on another server or account
 * (ImportPlanButton.tsx). How it works: docs/concepts/C1-frontend.md C1.15.6.
 *
 * Not a mutation: nothing changes on the server. The file is asked for when
 * the button is tapped, never kept in the cache, and saved by the browser
 * (src/lib/download.ts).
 */
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPlanFile, type Plan } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { downloadJson, fileNameOf } from '@/lib/download'

/** Props of ExportPlanButton. */
interface ExportPlanButtonProps {
  /**
   * The plan to export: its id, and its name for the file's. Pick<T, keys>:
   * T with only those fields, so any object that has them will do.
   */
  plan: Pick<Plan, 'id' | 'name'>
}

/** The Export button, with its error under the actions when it fails. */
export function ExportPlanButton({ plan }: ExportPlanButtonProps) {
  // t() translates a key (react-i18next, docs/concepts/C1-frontend.md C1.7)
  const { t } = useTranslation()
  // Two pieces of state (useState: a value React keeps between draws, and
  // a function to change it, which draws again).
  // While the file is asked for: the button waits
  const [busy, setBusy] = useState(false)
  // Whether the last try failed (offline, server down)
  const [failed, setFailed] = useState(false)

  /**
   * Asks for the file, then has the browser save it. `async`: it waits for
   * the server with `await`; a failure lands in `catch`.
   */
  async function exportPlan() {
    setBusy(true)
    setFailed(false)
    try {
      downloadJson(`${fileNameOf(plan.name)}.atleoplan.json`, await fetchPlanFile(plan.id))
    }
    catch {
      setFailed(true)
    }
    finally {
      // finally: runs after try or catch, whichever happened
      setBusy(false)
    }
  }

  return (
    // A fragment (<>…</>): two siblings without a wrapping element, so the
    // button stays one of the row of actions of the plan's page
    <>
      {/* Export, outlined like Edit and Archive. `void`: the Promise of the
          async function is not awaited here, on purpose */}
      <Button size="xl" variant="outline" pending={busy} onClick={() => void exportPlan()}>
        <Download aria-hidden="true" />
        {t('plans.detail.export')}
      </Button>
      {/* basis-full: on a line of its own, under the row of actions */}
      {failed && <div className="basis-full"><FormBanner variant="error">{t('plans.detail.exportError')}</FormBanner></div>}
    </>
  )
}
