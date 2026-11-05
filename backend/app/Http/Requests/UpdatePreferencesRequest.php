<?php

namespace App\Http\Requests;

use App\Enums\Locale;
use App\Enums\Theme;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates PATCH /api/user/preferences.
 *
 * A Form Request holds the rules of one endpoint outside the controller.
 * Laravel runs it before the controller method: when the input is not valid it
 * answers 422 with a message per field, and the method never runs
 * (docs/05-backend.md 5.5).
 */
class UpdatePreferencesRequest extends FormRequest
{
    /**
     * The rules. `sometimes` checks a field only when it is sent, so the app can
     * change one preference at a time. The other preferences of
     * docs/06-data-model.md 6.3 join here with the full settings (phase 2).
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'locale' => ['sometimes', Rule::enum(Locale::class)],
            'theme' => ['sometimes', Rule::enum(Theme::class)],
        ];
    }
}
