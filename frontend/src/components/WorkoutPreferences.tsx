/*
 * The workout preferences on Profile (docs/design/D1-ui.md D1.4.14, UI-7):
 * six rows of the settings list, five read by workout mode and one by the
 * plan editor.
 *
 * - **Weight unit**, kg or lb: how weights are shown and typed. They are
 *   kept in kilograms (docs/design/D3-data-model.md D3.2.3), so changing
 *   it converts nothing on the server. Not while a workout is in progress:
 *   its fields hold text typed in the old unit, and would be read in the
 *   new one at Finish.
 * - **Default rest**: the rest timer's length when a plan's exercise sets
 *   none; "No timer" is 0.
 * - **Weight step**: how much the big stepper's − and + move the weight
 *   (src/components/workout/SetStepper.tsx), in the user's unit.
 * - **Sound** and **vibration** at the end of the rest (src/lib/alarm.ts),
 *   and when the stopwatch of a timed set reaches its target.
 * - **RPE in plans**: whether the plan editor shows the RPE field beside each
 *   set's reps (src/components/plans/editor/EditorSet.tsx). Off by default.
 *
 * Each change is saved at once, one field per request, through the same
 * hook as the language and the theme (useUpdatePreferences, src/api/auth.ts),
 * which writes it into the cached user first: every screen reading the user
 * follows without waiting. How it works: docs/concepts/C1-frontend.md
 * C1.13.4; how it was built: docs/how-to/H3-frontend.md H3.21.
 */
import { Gauge, SlidersHorizontal, Timer, Vibrate, Volume2, Weight } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useUpdatePreferences, type User } from '@/api/auth'
import { formatSeconds } from '@/components/plans/plan-format'
import { SettingRow } from '@/components/SettingRow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { loadActiveSession } from '@/components/workout/session-storage'
import { formatWeight } from '@/lib/format'

/**
 * The unit, as the account keeps it: 'kg' or 'lb'. `User['weight_unit']` is
 * an **indexed access type**: the type of the field `weight_unit` of `User`,
 * taken from there rather than written again, so the two never disagree.
 */
type WeightUnit = User['weight_unit']

/** The rests offered, in seconds: none (no timer), then 30 s to 5 min. */
const REST_CHOICES = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

/**
 * The weight steps offered in each unit: the plates gyms have. In kilograms
 * down to 0.5 (a pair of 0.25 kg micro plates) and 1.25 (a pair of 0.625,
 * or one 1.25 on a dumbbell); in pounds the usual 2.5 to 10.
 */
const STEP_CHOICES: Record<WeightUnit, number[]> = {
  kg: [0.5, 1, 1.25, 2, 2.5, 5],
  lb: [1, 2.5, 5, 10],
}

/**
 * The step a unit starts with when the unit changes: 2.5 kg, or 5 lb (2.5 lb
 * is less than half of 2.5 kg, too fine a step for most gyms).
 */
const DEFAULT_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 }

/**
 * A step as the API takes and gives it, two decimals: 1.25 → "1.25",
 * 5 → "5.00". The same text the account holds, so the Select finds it.
 * @param step the step, a number
 */
function stepValue(step: number): string {
  return step.toFixed(2)
}

/**
 * A list of choices with the current value added, in order, when it is not
 * one of them (a value saved by an older version, or by hand), so the
 * Select can always show it.
 * @param choices the values offered
 * @param current the account's value
 */
function withCurrent(choices: number[], current: number): number[] {
  // [...choices, current]: a new list, the old one left as it is. sort()
  // with no function would compare numbers as text (10 before 2); the
  // function says how two compare: negative when a goes first
  return choices.includes(current) ? choices : [...choices, current].sort((a, b) => a - b)
}

/** The card with the six workout preferences. */
export function WorkoutPreferences() {
  // t() translates a key; i18n holds the current language
  const { t, i18n } = useTranslation()
  // The interface's language, for "90 s" and "2,5 kg"
  const language = i18n.language
  // The account; RequireAuth around Profile has already waited for it
  const { data: user } = useCurrentUser()
  // The request that saves a change, the same as the language's
  const updatePreferences = useUpdatePreferences()
  // A workout in progress on this phone, read once: the unit cannot change
  // while it runs. useState(() => …) takes a function, called on the first
  // draw only: localStorage is not read again at every draw. Only the value
  // is kept (`[busy]`), never changed here
  const [busy] = useState(() => loadActiveSession() !== null)
  // One id per control, linking each row's label to it (SettingRow)
  const unitId = useId()
  const restId = useId()
  const stepId = useId()
  const soundId = useId()
  const vibrationId = useId()
  const rpeId = useId()

  // No user yet: nothing to show. This early return comes after every hook
  // above, never before: React needs the same hooks, in the same order, at
  // every draw (the rules of hooks)
  if (!user) return null
  // The account's unit, and the step as a number ("2.50" → 2.5)
  const unit = user.weight_unit
  const step = Number(user.weight_step)

  /**
   * A new unit, with the step that suits it (DEFAULT_STEP), in one
   * request: a step of 2.5 chosen in kilograms means 2.5 lb, a much finer
   * step, once the unit is pounds.
   * @param next the unit chosen
   */
  function changeUnit(next: WeightUnit) {
    if (next === unit) return
    updatePreferences.mutate({ weight_unit: next, weight_step: stepValue(DEFAULT_STEP[next]) })
  }

  return (
    // The same card as the Preferences above it (ProfilePage)
    <section aria-labelledby="workout-prefs-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
      <h2 id="workout-prefs-title" className="font-heading text-lg font-extrabold tracking-tight">{t('preferences.workoutTitle')}</h2>
      <div className="divide-y divide-border">
        {/* The unit; the hint says why it is locked during a workout */}
        <SettingRow icon={Weight} label={t('preferences.unit')} description={busy ? t('preferences.unitBusy') : t('preferences.unitHint')} controlId={unitId}>
          {/* The Select hands back a plain string: `as WeightUnit` tells
              TypeScript it is one of ours, which holds: only kg and lb are offered */}
          <Select value={unit} disabled={busy} onValueChange={value => changeUnit(value as WeightUnit)}>
            <SelectTrigger id={unitId} className="h-11 w-full rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">{t('preferences.kg')}</SelectItem>
              <SelectItem value="lb">{t('preferences.lb')}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        {/* The default rest. A Select's values are text: String() going
            in, Number() coming out */}
        <SettingRow icon={Timer} label={t('preferences.rest')} description={t('preferences.restHint')} controlId={restId}>
          <Select value={String(user.default_rest_seconds)} onValueChange={value => updatePreferences.mutate({ default_rest_seconds: Number(value) })}>
            <SelectTrigger id={restId} className="h-11 w-full rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {withCurrent(REST_CHOICES, user.default_rest_seconds).map(seconds => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds === 0 ? t('preferences.restNone') : formatSeconds(seconds, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        {/* The stepper's weight step, in the unit chosen above: "2,5 kg" */}
        <SettingRow icon={SlidersHorizontal} label={t('preferences.step')} description={t('preferences.stepHint')} controlId={stepId}>
          <Select value={stepValue(step)} onValueChange={value => updatePreferences.mutate({ weight_step: value })}>
            <SelectTrigger id={stepId} className="h-11 w-full rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {withCurrent(STEP_CHOICES[unit], step).map(choice => (
                <SelectItem key={choice} value={stepValue(choice)}>{formatWeight(choice, language, unit)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        {/* Sound and vibration: on/off switches, saved on each tap */}
        <SettingRow icon={Volume2} label={t('preferences.sound')} description={t('preferences.soundHint')} controlId={soundId}>
          <Switch id={soundId} size="lg" checked={user.timer_sound} onCheckedChange={checked => updatePreferences.mutate({ timer_sound: checked })} />
        </SettingRow>
        <SettingRow icon={Vibrate} label={t('preferences.vibration')} description={t('preferences.vibrationHint')} controlId={vibrationId}>
          <Switch id={vibrationId} size="lg" checked={user.timer_vibration} onCheckedChange={checked => updatePreferences.mutate({ timer_vibration: checked })} />
        </SettingRow>

        {/* The plan editor's RPE field, shown or hidden */}
        <SettingRow icon={Gauge} label={t('preferences.rpe')} description={t('preferences.rpeHint')} controlId={rpeId}>
          <Switch id={rpeId} size="lg" checked={user.show_rpe} onCheckedChange={checked => updatePreferences.mutate({ show_rpe: checked })} />
        </SettingRow>
      </div>
    </section>
  )
}
