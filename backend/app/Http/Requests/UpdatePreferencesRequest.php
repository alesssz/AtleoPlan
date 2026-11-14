<?php

namespace App\Http\Requests;

use App\Enums\Locale;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/user/preferences: one preference at a time.
 */
class UpdatePreferencesRequest extends FormRequest
{
    /**
     * - weight_unit changes only how weights are shown and typed: they stay in
     *   kilograms, so nothing is converted.
     * - default_rest_seconds: 0 means no rest timer.
     * - weight_step is in the user's unit, from 0.25 (micro plates); two
     *   decimals, as `numeric(5,2)` keeps them.
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
