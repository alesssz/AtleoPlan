<?php

namespace App\Http\Requests;

// Imports: the two enums whose values are allowed, Laravel's base Form
// Request, and Rule, which builds the rules that are objects
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates POST /api/exercises: a new personal exercise, from the editor of
 * docs/design/D1-ui.md D1.4.5.
 *
 * A Form Request (docs/concepts/C2-backend.md C2.5): Laravel runs these rules
 * before the controller, and answers 422 with a message per field when one
 * fails. The messages are in lang/{it,es,de}/validation.php.
 *
 * The body the React app sends, in the user's language:
 *
 *     {
 *       "name": "Panca mia",
 *       "aliases": ["panca stretta"],
 *       "description": "…",
 *       "instructions": ["Sdraiati sulla panca.", "Abbassa il bilanciere."],
 *       "logging_type": "weight_reps",
 *       "equipment_id": 1,
 *       "youtube_url": "https://youtu.be/…",
 *       "muscles": [{"id": 6, "role": "primary"}, {"id": 17, "role": "secondary"}]
 *     }
 *
 * Only `name` is required. Photos and videos are not here: they have their
 * own upload endpoint (BE-1, feat/exercise-media).
 *
 * The generated authorize() method, which returned false, was removed:
 * permissions are ExercisePolicy's job (docs/how-to/H2-backend.md H2.3.6).
 * UpdateExerciseRequest extends this class and reuses the same rules.
 */
class StoreExerciseRequest extends FormRequest
{
    /**
     * The rules, one array per field. `.*` means "each item of the list":
     * `aliases.*` checks every alias, `muscles.*.id` the id of every muscle.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            // nullable: the field may be sent as null to empty it
            'aliases' => ['nullable', 'array', 'max:10'],
            // distinct: the same alias twice is refused
            'aliases.*' => ['string', 'max:100', 'distinct'],
            'description' => ['nullable', 'string', 'max:2000'],
            'instructions' => ['nullable', 'array', 'max:30'],
            'instructions.*' => ['string', 'max:1000'],
            // One of the enum's values: weight_reps, reps, time, distance
            'logging_type' => [Rule::enum(LoggingType::class)],
            // exists:equipment,id: there must be a row of `equipment` with this id
            'equipment_id' => ['nullable', 'integer', 'exists:equipment,id'],
            // A YouTube address only: the editor shows its preview (D1.4.5).
            // regex: the text must match the pattern between the # signs;
            // the final i ignores upper and lower case
            'youtube_url' => ['nullable', 'url', 'max:255', 'regex:#^https://(www\.|m\.)?(youtube\.com|youtu\.be)/#i'],
            // At most 17: there are 17 muscles
            'muscles' => ['nullable', 'array', 'max:17'],
            // distinct: a muscle once per exercise, as the table's key requires
            'muscles.*.id' => ['required', 'integer', 'distinct', 'exists:muscles,id'],
            'muscles.*.role' => ['required', Rule::enum(MuscleRole::class)],
        ];
    }
}
