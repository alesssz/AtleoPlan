<?php

namespace App\Http\Requests;

// Imports: the plan file's format, the enums of the exercise's fields, the
// rule class for supersets, Laravel's base Form Request and Rule
use App\Actions\Plans\ExportPlan;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Rules\SupersetsAreNeighbours;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates POST /api/plans/import: a plan file, as ExportPlan writes it
 * (docs/design/D3-data-model.md D3.5.8), read by the app and sent as the
 * request's JSON body.
 *
 * The plan's rules are the editor's (PlanRequest), under `plan.`, with one
 * difference: an item names an exercise of the file, `"exercise": "e1"`,
 * which must be one of the file's `exercises`. No ids: an import is always
 * a new plan. The exercises' rules are those of a personal exercise
 * (StoreExerciseRequest), with equipment and muscles named by slug; a slug
 * this server does not know is not an error, ImportPlan leaves it out.
 *
 * A Form Request holds the rules of one endpoint outside the controller:
 * Laravel runs it before the controller method, and answers 422 with a
 * message per field when the input is not valid (docs/concepts/C2-backend.md
 * C2.5). Created with `make:request ImportPlanRequest`; the generated
 * authorize() was removed, as in the other requests: permissions are
 * PlanPolicy's (PlanController::import() asks it). How it works: C2.5.8.
 */
class ImportPlanRequest extends FormRequest
{
    /**
     * The rules.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // The references the file declares, to check those the items use.
        // input(): the body before validation, so anything may be there;
        // only texts are kept
        $refs = collect($this->input('exercises'))
            ->pluck('ref')
            ->filter(fn ($ref) => is_string($ref))
            ->all();

        return [
            // What the file is, and a version this app reads
            'format' => ['required', Rule::in([ExportPlan::FORMAT])],
            'version' => ['required', 'integer', Rule::in([ExportPlan::VERSION])],

            'plan' => ['required', 'array'],
            'plan.name' => ['required', 'string', 'max:100'],
            'plan.goal' => ['nullable', 'string', 'max:100'],
            'plan.notes' => ['nullable', 'string', 'max:2000'],
            'plan.days' => ['present', 'array', 'max:14'],
            'plan.days.*.name' => ['required', 'string', 'max:50'],
            'plan.days.*.items' => ['present', 'array', 'max:30', new SupersetsAreNeighbours],
            // One of the file's exercises
            'plan.days.*.items.*.exercise' => ['required', 'string', Rule::in($refs)],
            // The same rules as the editor's for the rest of an item and its
            // sets. `...` spreads the array returned into this one, as if
            // its lines were written here
            ...PlanRequest::itemRules('plan.days.*.items.*.'),

            // The exercises, each described in full; at most one per item
            'exercises' => ['present', 'array', 'max:420'],
            // distinct: no reference twice in the file
            'exercises.*.ref' => ['required', 'string', 'max:20', 'distinct'],
            'exercises.*.external_id' => ['nullable', 'string', 'max:255'],
            'exercises.*.name' => ['required', 'string', 'max:100'],
            'exercises.*.logging_type' => ['required', Rule::enum(LoggingType::class)],
            'exercises.*.equipment' => ['nullable', 'string', 'max:50'],
            'exercises.*.muscles' => ['nullable', 'array', 'max:17'],
            'exercises.*.muscles.*.muscle' => ['required', 'string', 'max:50'],
            'exercises.*.muscles.*.role' => ['required', Rule::enum(MuscleRole::class)],
            'exercises.*.description' => ['nullable', 'string', 'max:2000'],
            'exercises.*.instructions' => ['nullable', 'array', 'max:30'],
            'exercises.*.instructions.*' => ['string', 'max:1000'],
            // A YouTube address, as for a personal exercise (StoreExerciseRequest)
            'exercises.*.youtube_url' => ['nullable', 'url', 'max:255', 'regex:#^https://(www\.|m\.)?(youtube\.com|youtu\.be)/#i'],
        ];
    }
}
