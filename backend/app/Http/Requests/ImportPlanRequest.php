<?php

namespace App\Http\Requests;

use App\Actions\Plans\ExportPlan;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Rules\SupersetsAreNeighbours;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /api/plans/import: a plan file as ExportPlan writes it.
 *
 * The plan's rules are the editor's (PlanRequest) under `plan.`, except that
 * an item names one of the file's exercises, `"exercise": "e1"`, and there
 * are no ids: an import is always a new plan. The exercises' rules are a
 * personal exercise's, with equipment and muscles by slug; an unknown slug is
 * not an error, ImportPlan leaves it out.
 */
class ImportPlanRequest extends FormRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // Read before validation, so only strings are kept
        $refs = collect($this->input('exercises'))
            ->pluck('ref')
            ->filter(fn ($ref) => is_string($ref))
            ->all();

        return [
            'format' => ['required', Rule::in([ExportPlan::FORMAT])],
            'version' => ['required', 'integer', Rule::in([ExportPlan::VERSION])],

            'plan' => ['required', 'array'],
            'plan.name' => ['required', 'string', 'max:100'],
            'plan.goal' => ['nullable', 'string', 'max:100'],
            'plan.notes' => ['nullable', 'string', 'max:2000'],
            'plan.days' => ['present', 'array', 'max:14'],
            'plan.days.*.name' => ['required', 'string', 'max:50'],
            'plan.days.*.items' => ['present', 'array', 'max:30', new SupersetsAreNeighbours],
            'plan.days.*.items.*.exercise' => ['required', 'string', Rule::in($refs)],
            ...PlanRequest::itemRules('plan.days.*.items.*.'),

            // At most one per item: 14 days × 30
            'exercises' => ['present', 'array', 'max:420'],
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
            'exercises.*.youtube_url' => ['nullable', 'url', 'max:255', 'regex:#^https://(www\.|m\.)?(youtube\.com|youtu\.be)/#i'],
        ];
    }
}
