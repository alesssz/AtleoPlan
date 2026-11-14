/*
 * The plan editor, in two steps on one draft: first the plan's details
 * (EditorOverview: name, goal, notes, the number of days and their names), then
 * the exercises (EditorDays: the days as tabs, under each its exercises, their
 * sets and their supersets). Used by PlanEditorPage for /plans/new and
 * /plans/:id/edit.
 *
 * Which step shows is in the address: `?day=2` is the second step with the
 * second day's tab open, no `?day=` the first step. So the phone's Back button,
 * or the browser's, goes from the exercises back to the details, as people
 * expect, and a reload stays where it was.
 *
 * The draft is one reducer state (draftReducer, plan-draft.ts); the pieces
 * below get `dispatch`, and none holds a copy of the plan.
 *
 * The draft is kept in the browser at every change (draft-storage.ts), so
 * nothing is lost by leaving; "Discard changes" goes back to the plan as it
 * was opened. Saving sends the whole plan in one request.
 */
import { Save, Undo2 } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { PlanInput, PlanSaved } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { clearDraft, loadDraft, storeDraft } from '../draft-storage'
import { draftField, draftReducer, toPlanInput, validateDraft, type DraftErrors, type PlanDraft } from '../plan-draft'
import { EditorDays } from './EditorDays'
import { EditorOverview } from './EditorOverview'

/**
 * The user's rest when an exercise sets none and the user is not loaded
 * yet: the backend's own default (users.default_rest_seconds).
 */
const FALLBACK_REST_SECONDS = 90

/**
 * The path of an error in a day's exercises, "days.2.items.0.sets.1.reps":
 * the first group, (\d+), catches the day's index. Such an error shows in
 * the second step; any other (the name, a day's name) in the first.
 */
const ITEM_ERROR = /^days\.(\d+)\.items\./

/**
 * What the editor keeps in a history entry's `state` (the second argument of a
 * navigation): whether the second step was opened from the first, so the entry
 * before it is the first step's.
 */
interface EditorHistoryState {
  fromPlan: boolean
}

interface PlanEditorProps {
  /** The plan as it is opened: saved, or new and empty. */
  initial: PlanDraft
  /** The key of the draft kept in the browser (draft-storage.ts). */
  storageKey: string
  /** Sends the plan: POST for a new one, PUT for a saved one. */
  save: (input: PlanInput) => Promise<PlanSaved>
  /** Called after a save, with what the server answered. */
  onSaved: (saved: PlanSaved) => void
  /** The save button's text: "Create plan" or "Save". */
  submitLabel: string
  /** Where Cancel goes. */
  cancelTo: string
}

export function PlanEditor({ initial, storageKey, save, onSaved, submitLabel, cancelTo }: PlanEditorProps) {
  const { t, i18n } = useTranslation()
  const { data: user } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const unit = user?.weight_unit ?? 'kg'
  const defaultRestSeconds = user?.default_rest_seconds ?? FALLBACK_REST_SECONDS
  // Whether the sets show the RPE field: a preference of Profile, off by default
  const showRpe = user?.show_rpe ?? false

  // Read once, when the editor opens
  const [kept] = useState(() => loadDraft(storageKey))
  const [draft, dispatch] = useReducer(draftReducer, kept?.draft ?? initial)

  const [errors, setErrors] = useState<DraftErrors>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // The simplest deep comparison of two plain trees
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  // Forgotten again when it is back to the plan as opened
  useEffect(() => {
    if (dirty) storeDraft(storageKey, draft)
    else clearDraft(storageKey)
  }, [draft, dirty, storageKey])

  // The open day's index, from `?day=` (1 for the first), or null for the
  // first step. Anything that is not one of the draft's days, a hand-typed
  // ?day=9 or a day just discarded, shows the first step
  const requested = Number(searchParams.get('day'))
  const openDay = searchParams.has('day') && Number.isInteger(requested) && requested >= 1 && requested <= draft.days.length ? requested - 1 : null
  const fromPlan = (location.state as EditorHistoryState | null)?.fromPlan === true

  /**
   * The translated message of a field's error, or undefined when it has none.
   * @param path the field's path in the draft, such as 'days.0.name'
   */
  function errorOf(path: string): string | undefined {
    const key = errors[path]
    return key === undefined ? undefined : key.startsWith('plans.') ? t(key as 'plans.editor.errors.tooLong') : key
  }

  /**
   * Whether any error's path starts with this text.
   * @param prefix such as 'days.1.items.', every error of the second day's exercises
   */
  function hasErrors(prefix: string): boolean {
    return Object.keys(errors).some(path => path.startsWith(prefix))
  }

  /**
   * Opens a day's tab in the second step. From the first step it is a new
   * history entry, so Back returns to the details; from another tab it
   * replaces the entry, so Back still returns to the details, not to the
   * last tab seen.
   * @param index the day's index, from 0
   */
  function goToDay(index: number) {
    if (index === openDay) return
    if (openDay === null) setSearchParams({ day: String(index + 1) }, { state: { fromPlan: true } satisfies EditorHistoryState })
    else setSearchParams({ day: String(index + 1) }, { replace: true, state: location.state as EditorHistoryState | null })
  }

  /**
   * Back to the first step. When the second was opened from it, this is the
   * history's Back, so the browser's own Back button does not then return to
   * the exercises; otherwise (a reload, a link to ?day=2) the entry is
   * replaced.
   */
  function backToPlan() {
    if (fromPlan) void navigate(-1)
    else setSearchParams({}, { replace: true })
  }

  /**
   * Shows errors, and the step where they are: the first, when any is there
   * (the name, a day's name); otherwise the tab of the first day with one.
   * @param found the errors, by path
   */
  function showErrors(found: DraftErrors) {
    setErrors(found)
    const paths = Object.keys(found)
    if (paths.some(path => !ITEM_ERROR.test(path))) {
      if (openDay !== null) backToPlan()
      return
    }
    const firstDay = paths.map(path => ITEM_ERROR.exec(path)?.[1]).find(index => index !== undefined)
    if (firstDay !== undefined) goToDay(Number(firstDay))
  }

  /** Checks the draft, then sends it; on success, forgets the kept draft. */
  async function submit() {
    setFailure(null)
    const found = validateDraft(draft, unit)
    if (Object.keys(found).length > 0) {
      showErrors(found)
      setFailure(t('plans.editor.invalid'))
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const saved = await save(toPlanInput(draft, unit))
      clearDraft(storageKey)
      // Saved from the second step opened from the first: back to the first
      // step's entry first, so the plan's page replaces it and Back from
      // there does not return to the editor
      if (openDay !== null && fromPlan) await navigate(-1)
      onSaved(saved)
    }
    catch (error) {
      setSaving(false)
      if (error instanceof ApiError && error.status === 422) {
        // The backend names fields as the API does
        const fromServer: DraftErrors = {}
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          fromServer[draftField(field)] = messages[0] ?? ''
        }
        showErrors(fromServer)
        setFailure(t('plans.editor.invalid'))
      }
      else {
        setFailure(t('plans.editor.saveError'))
      }
    }
  }

  /** Back to the plan as it was opened, and forgets the kept draft. */
  function discard() {
    dispatch({ type: 'replace', draft: initial })
    setErrors({})
    setFailure(null)
    clearDraft(storageKey)
  }

  // A sticky bar, so Save stays in reach and is never doubled. One lime button
  // at a time: in the first step it is EditorOverview's "Next", so Save is
  // outlined there
  const saveVariant = openDay === null ? 'outline' : 'default'
  const actions = (
    <div className="sticky top-0 z-20 -my-2 flex flex-wrap items-center gap-3 bg-background/85 py-2 backdrop-blur">
      <Button size="xl" variant={saveVariant} pending={saving} onClick={() => void submit()}>
        <Save aria-hidden="true" />
        {submitLabel}
      </Button>
      {dirty && (
        <Button size="xl" variant="outline" disabled={saving} onClick={discard}>
          <Undo2 aria-hidden="true" />
          {t('plans.editor.discard')}
        </Button>
      )}
      <Button asChild size="xl" variant="ghost">
        <Link to={cancelTo}>{t('plans.editor.cancel')}</Link>
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* A draft from an earlier visit was brought back */}
      {kept && dirty && <FormBanner variant="success">{t('plans.editor.restored')}</FormBanner>}

      {actions}
      {failure && <FormBanner variant="error">{failure}</FormBanner>}

      {openDay === null
        ? <EditorOverview draft={draft} dispatch={dispatch} errorOf={errorOf} onNext={() => goToDay(0)} />
        : (
            <EditorDays
              draft={draft}
              openDay={openDay}
              dispatch={dispatch}
              errorOf={errorOf}
              hasErrors={hasErrors}
              unit={unit}
              showRpe={showRpe}
              defaultRestSeconds={defaultRestSeconds}
              language={i18n.language}
              onOpenDay={goToDay}
              onBack={backToPlan}
            />
          )}
    </div>
  )
}
