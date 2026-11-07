/*
 * The plan editor (docs/design/D1-ui.md D1.4.8): the plan's name, goal and
 * notes, its days as tabs, and in each day the exercises, their sets and
 * their supersets. Used by PlanEditorPage for /plans/new and
 * /plans/:id/edit. How it works: docs/concepts/C1-frontend.md C1.16.
 *
 * The draft is one object held with React's useReducer: every change is an
 * action ("add a set to this exercise") given to draftReducer
 * (plan-draft.ts), which returns the next draft. The pieces below
 * (EditorDay, EditorItem, EditorSet) get `dispatch` and send actions; none
 * of them holds a copy of the plan.
 *
 * The draft is kept in the browser at every change (draft-storage.ts), so
 * nothing is lost by leaving; "Discard changes" goes back to the plan as it
 * was opened. Saving sends the whole plan in one request.
 */
import { Plus, Save, Undo2 } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { PlanInput, PlanSaved } from '@/api/plans'
import { FormBanner } from '@/components/FormBanner'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/http'
import { clearDraft, loadDraft, storeDraft } from '../draft-storage'
import { LIMITS, draftField, draftReducer, toPlanInput, validateDraft, type DraftErrors, type PlanDraft } from '../plan-draft'
import { EditorDay } from './EditorDay'

/**
 * The user's rest when an exercise sets none and the user is not loaded
 * yet: the backend's own default (users.default_rest_seconds).
 */
const FALLBACK_REST_SECONDS = 90

/** Props of PlanEditor. */
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

/** The editor: the plan's fields, its days, Save and Discard. */
export function PlanEditor({ initial, storageKey, save, onSaved, submitLabel, cancelTo }: PlanEditorProps) {
  const { t, i18n } = useTranslation()
  const { data: user } = useCurrentUser()
  const unit = user?.weight_unit ?? 'kg'
  const defaultRestSeconds = user?.default_rest_seconds ?? FALLBACK_REST_SECONDS

  // The draft kept from an earlier visit, read once, when the editor opens
  const [kept] = useState(() => loadDraft(storageKey))
  // useReducer(reducer, first state): `draft` is the state, `dispatch(action)`
  // asks the reducer for the next one, and React draws again with it
  const [draft, dispatch] = useReducer(draftReducer, kept?.draft ?? initial)

  // The open day's index; the errors to show; whether a save is running;
  // the message of a failed save
  const [dayIndex, setDayIndex] = useState(0)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Whether the draft differs from the plan as opened. JSON.stringify turns
  // each into text, the simplest way to compare two trees of objects
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  // Keeps the draft in the browser after every change, and forgets it when
  // it is back to the plan as opened. An effect: it runs after React has
  // drawn, every time `draft` changes (docs/learn/L2-react.md L2.9)
  useEffect(() => {
    if (dirty) storeDraft(storageKey, draft)
    else clearDraft(storageKey)
  }, [draft, dirty, storageKey])

  // The open day stays a real one when days are removed
  const openDay = Math.min(dayIndex, Math.max(draft.days.length - 1, 0))

  /**
   * The translated message of a field's error, or undefined when it has none.
   * @param path the field's path in the draft, such as 'days.0.name'
   */
  function errorOf(path: string): string | undefined {
    const key = errors[path]
    // A key of ours is translated; a server's message arrives translated
    return key === undefined ? undefined : key.startsWith('plans.') ? t(key as 'plans.editor.errors.tooLong') : key
  }

  /**
   * Shows errors, and opens the first day that has one.
   * @param found the errors, by path
   */
  function showErrors(found: DraftErrors) {
    setErrors(found)
    // The first path that names a day: "days.2.…" gives 2
    const firstDay = Object.keys(found).map(path => /^days\.(\d+)\./.exec(path)?.[1]).find(index => index !== undefined)
    if (firstDay !== undefined) setDayIndex(Number(firstDay))
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
      onSaved(saved)
    }
    catch (error) {
      setSaving(false)
      if (error instanceof ApiError && error.status === 422) {
        // The server's messages, each under its field: the backend names
        // fields as the API does, draftField() as the draft does
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

  /** Adds a day, named with the next letter: "Day D" after three days, and opens it. */
  function addDay() {
    // String.fromCharCode(65) is "A": 65 + 3 gives "D"
    const letter = String.fromCharCode(65 + draft.days.length)
    dispatch({ type: 'addDay', name: t('plans.editor.defaultDayName', { letter }) })
    setDayIndex(draft.days.length)
  }

  // The buttons, in a bar that sticks to the top of the screen while a long
  // plan scrolls, as the library's search does (C1.14.3): Save is always in
  // reach, and there is one of each button, never two
  const actions = (
    <div className="sticky top-0 z-20 -my-2 flex flex-wrap items-center gap-3 bg-background/85 py-2 backdrop-blur">
      <Button size="xl" disabled={saving} onClick={() => void submit()}>
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

      {/* The plan's own fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('plans.editor.planName')}
          value={draft.name}
          onChange={event => dispatch({ type: 'setPlanField', field: 'name', value: event.target.value })}
          error={errorOf('name')}
          maxLength={100}
        />
        <FormField
          label={t('plans.editor.goal')}
          placeholder={t('plans.editor.goalPlaceholder')}
          value={draft.goal}
          onChange={event => dispatch({ type: 'setPlanField', field: 'goal', value: event.target.value })}
          error={errorOf('goal')}
          maxLength={100}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-notes">{t('plans.editor.notes')}</Label>
        <Textarea
          id="plan-notes"
          value={draft.notes}
          onChange={event => dispatch({ type: 'setPlanField', field: 'notes', value: event.target.value })}
          maxLength={2000}
          className="min-h-20 rounded-xl md:text-base"
        />
      </div>

      {/* The days as tabs, as on the plan's page; the open one is kept in
          state here, not in the address: the editor is one visit */}
      <Tabs value={String(openDay)} onValueChange={value => setDayIndex(Number(value))}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
            <TabsList aria-label={t('plans.editor.daysLabel')} className="h-auto! rounded-xl p-1">
              {draft.days.map((day, index) => (
                <TabsTrigger key={day.id} value={String(index)} className="min-h-12 flex-none rounded-lg px-4 text-sm">
                  {/* A day with no name yet still needs a tab to click */}
                  {day.name.trim() || t('plans.editor.defaultDayName', { letter: String.fromCharCode(65 + index) })}
                  {/* A dot on a day that has an error, with its meaning in words */}
                  {Object.keys(errors).some(path => path.startsWith(`days.${index}.`)) && (
                    <span className="size-2 rounded-full bg-destructive">
                      <span className="sr-only">{t('plans.editor.invalid')}</span>
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Button variant="outline" size="xl" onClick={addDay} disabled={draft.days.length >= LIMITS.days}>
            <Plus aria-hidden="true" />
            {t('plans.editor.addDay')}
          </Button>
        </div>

        {draft.days.map((day, index) => (
          <TabsContent key={day.id} value={String(index)} className="pt-4 text-base">
            <EditorDay
              day={day}
              dayIndex={index}
              days={draft.days}
              dispatch={dispatch}
              errorOf={errorOf}
              unit={unit}
              defaultRestSeconds={defaultRestSeconds}
              language={i18n.language}
              onMoved={setDayIndex}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
