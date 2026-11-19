/*
 * Profile's workout preferences, the Workout tab, in short groups: Weights
 * (unit, step), Timers (default rest, countdown before a timed set), Sound
 * and vibration, Plans (RPE). Each change is saved at once,
 * optimistically, like the language and the theme.
 *
 * The unit is locked while a workout is in progress: its fields hold text
 * typed in the old unit, and would be read in the new one at Finish. Weights
 * are stored in kilograms, so changing it converts nothing on the server.
 */
import { Gauge, Hourglass, SlidersHorizontal, Timer, Vibrate, Volume2, Weight } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useUpdatePreferences, type User } from '@/api/auth'
import { formatSeconds } from '@/components/plans/plan-format'
import { SettingGroup } from '@/components/SettingGroup'
import { SettingRow } from '@/components/SettingRow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { loadActiveSession } from '@/components/workout/session-storage'
import { formatWeight } from '@/lib/format'

type WeightUnit = User['weight_unit']

/** 0: no timer. */
const REST_CHOICES = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

/** 0: the stopwatch starts at once. */
const COUNTDOWN_CHOICES = [0, 3, 5, 10, 15, 30]

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
 * Adds the account's value, in order, when it is not among the choices, so the
 * Select can always show it.
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
  const countdownId = useId()
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
    <div className="flex flex-col gap-6">
      <SettingGroup title={t('preferences.groups.weights')}>
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
      </SettingGroup>

      <SettingGroup title={t('preferences.groups.timers')}>
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
        <SettingRow icon={Hourglass} label={t('preferences.countdown')} description={t('preferences.countdownHint')} controlId={countdownId}>
          <Select value={String(user.countdown_seconds)} onValueChange={value => updatePreferences.mutate({ countdown_seconds: Number(value) })}>
            <SelectTrigger id={countdownId} className="h-11 w-full rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {withCurrent(COUNTDOWN_CHOICES, user.countdown_seconds).map(seconds => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds === 0 ? t('preferences.countdownNone') : formatSeconds(seconds, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title={t('preferences.groups.sound')}>
        <SettingRow icon={Volume2} label={t('preferences.sound')} description={t('preferences.soundHint')} inline controlId={soundId}>
          <Switch id={soundId} size="lg" checked={user.timer_sound} onCheckedChange={checked => updatePreferences.mutate({ timer_sound: checked })} />
        </SettingRow>
        <SettingRow icon={Vibrate} label={t('preferences.vibration')} description={t('preferences.vibrationHint')} inline controlId={vibrationId}>
          <Switch id={vibrationId} size="lg" checked={user.timer_vibration} onCheckedChange={checked => updatePreferences.mutate({ timer_vibration: checked })} />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title={t('preferences.groups.plans')}>
        <SettingRow icon={Gauge} label={t('preferences.rpe')} description={t('preferences.rpeHint')} inline controlId={rpeId}>
          <Switch id={rpeId} size="lg" checked={user.show_rpe} onCheckedChange={checked => updatePreferences.mutate({ show_rpe: checked })} />
        </SettingRow>
      </SettingGroup>
    </div>
  )
}
