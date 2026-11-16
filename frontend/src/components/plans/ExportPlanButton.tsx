/*
 * Saves the plan as `<name>.atleoplan.json`, for ImportPlanButton on another
 * server or account. Not a mutation: the file is fetched on tap, never cached.
 */
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchPlanFile, type Plan } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { downloadJson, fileNameOf } from '@/lib/download'

interface ExportPlanButtonProps {
  /** Its name names the file. */
  plan: Pick<Plan, 'id' | 'name'>
}

export function ExportPlanButton({ plan }: ExportPlanButtonProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

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
      setBusy(false)
    }
  }

  return (
    // No wrapper: the button stays one of the page's row of actions
    <>
      <Button size="xl" variant="outline" pending={busy} onClick={() => void exportPlan()}>
        <Download aria-hidden="true" />
        {t('plans.detail.export')}
      </Button>
      {/* On a line of its own, under the row of actions */}
      {failed && <div className="basis-full"><FormBanner variant="error">{t('plans.detail.exportError')}</FormBanner></div>}
    </>
  )
}
