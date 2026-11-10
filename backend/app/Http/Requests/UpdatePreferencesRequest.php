<?php

namespace App\Http\Requests;

use App\Enums\Locale;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates PATCH /api/user/preferences.
 *
 * A Form Request holds the rules of one endpoint outside the controller.
 * Laravel runs it before the controller method: when the input is not valid it
 * answers 422 with a message per field, and the method never runs
 * (docs/concepts/C2-backend.md C2.5).
 */
class UpdatePreferencesRequest extends FormRequest
{
    /**
     * The rules. `sometimes` checks a field only when it is sent, so the app can
     * change one preference at a time: the language, the theme, the five
     * that workout mode reads and the one of the plan editor
     * (docs/design/D3-data-model.md D3.3, D1.4.14).
     *
     * - weight_unit: kg or lb. Only how weights are shown and typed; they stay
     *   in kilograms (D3.2.3), so changing it converts nothing.
     * - default_rest_seconds: from 0 (no rest timer) to 10 minutes.
     * - weight_step: the stepper's step, in the user's unit; 0.25 (micro
     *   plates) to 50, two decimals at most, as the column keeps them
     *   (`numeric(5,2)`). `decimal:0,2` counts the decimals of what is sent.
     * - timer_sound, timer_vibration: true or false (also 1, 0, "1", "0").
     * - show_rpe: true or false, whether the plan editor shows the RPE field.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'locale' => ['sometimes', Rule::enum(Locale::class)],
            'theme' => ['sometimes', Rule::enum(Theme::class)],
            'weight_unit' => ['sometimes', Rule::enum(WeightUnit::class)],
            'default_rest_seconds' => ['sometimes', 'integer', 'between:0,600'],
            'weight_step' => ['sometimes', 'numeric', 'between:0.25,50', 'decimal:0,2'],
            'timer_sound' => ['sometimes', 'boolean'],
            'timer_vibration' => ['sometimes', 'boolean'],
            'show_rpe' => ['sometimes', 'boolean'],
        ];
    }
}
