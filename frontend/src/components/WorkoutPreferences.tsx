/*
 * The workout preferences on Profile: six rows of the settings list, five read
 * by workout mode and one by the plan editor.
 *
 * - **Weight unit**, kg or lb: how weights are shown and typed. They are kept
 *   in kilograms, so changing it converts nothing on the server. Not while a
 *   workout is in progress: its fields hold text typed in the old unit, and
 *   would be read in the new one at Finish.
 * - **Default rest**: the rest timer's length when a plan's exercise sets
 *   none; "No timer" is 0.
 * - **Weight step**: how much the big stepper's − and + move the weight
 *   (src/components/workout/SetStepper.tsx), in the user's unit.
 * - **Sound** and **vibration** at the end of the rest (src/lib/alarm.ts),
 *   and when the stopwatch of a timed set reaches its target.
 * - **RPE in plans**: whether the plan editor shows the RPE field beside each
 *   set's reps (src/components/plans/editor/EditorSet.tsx). Off by default.
 *
 * Each change is saved at once, optimistically, like the language and the
 * theme.
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

type WeightUnit = User['weight_unit']

/** 0: no timer. */
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

/** Two decimals, as the account holds it, so the Select finds it: 5 → "5.00". */
function stepValue(step: number): string {
  return step.toFixed(2)
}

/**
 * The account's value added in order when it is not offered (saved by an
 * older version, or by hand), so the Select can always show it.
 */
function withCurrent(choices: number[], current: number): number[] {
  return choices.includes(current) ? choices : [...choices, current].sort((a, b) => a - b)
}

export function WorkoutPreferences() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { data: user } = useCurrentUser()
  const updatePreferences = useUpdatePreferences()
  // The unit is locked while a workout is in progress on this phone
  const [busy] = useState(() => loadActiveSession() !== null)
  const unitId = useId()
  const restId = useId()
  const stepId = useId()
  const soundId = useId()
  const vibrationId = useId()
  const rpeId = useId()

  if (!user) return null
  const unit = user.weight_unit
  const step = Number(user.weight_step)

  /**
   * With the step that suits the new unit, in one request: 2.5 chosen in
   * kilograms would be a much finer 2.5 lb.
   */
  function changeUnit(next: WeightUnit) {
    if (next === unit) return
    updatePreferences.mutate({ weight_unit: next, weight_step: stepValue(DEFAULT_STEP[next]) })
  }

  return (
    <section aria-labelledby="workout-prefs-title" className="rounded-3xl border bg-card/60 px-6 pt-6 backdrop-blur sm:px-8">
      <h2 id="workout-prefs-title" className="font-heading text-lg font-extrabold tracking-tight">{t('preferences.workoutTitle')}</h2>
      <div className="divide-y divide-border">
        <SettingRow icon={Weight} label={t('preferences.unit')} description={busy ? t('preferences.unitBusy') : t('preferences.unitHint')} controlId={unitId}>
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

        <SettingRow icon={Volume2} label={t('preferences.sound')} description={t('preferences.soundHint')} controlId={soundId}>
          <Switch id={soundId} size="lg" checked={user.timer_sound} onCheckedChange={checked => updatePreferences.mutate({ timer_sound: checked })} />
        </SettingRow>
        <SettingRow icon={Vibrate} label={t('preferences.vibration')} description={t('preferences.vibrationHint')} controlId={vibrationId}>
          <Switch id={vibrationId} size="lg" checked={user.timer_vibration} onCheckedChange={checked => updatePreferences.mutate({ timer_vibration: checked })} />
        </SettingRow>

        <SettingRow icon={Gauge} label={t('preferences.rpe')} description={t('preferences.rpeHint')} controlId={rpeId}>
          <Switch id={rpeId} size="lg" checked={user.show_rpe} onCheckedChange={checked => updatePreferences.mutate({ show_rpe: checked })} />
        </SettingRow>
      </div>
    </section>
  )
}
