<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, Laravel's base resource, and Carbon for a date
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * The JSON shape of a plan. The same class serves the list and the whole
 * plan: the keys of what was not loaded are left out (whenLoaded,
 * whenCounted), so the list has `days_count` and the whole plan has `days`.
 *
 * In the list (GET /api/plans; docs/design/D1-ui.md D1.4.6):
 *
 *     {
 *       "id": "0192f4a7-…",
 *       "name": "Push Pull Legs",
 *       "goal": "Hypertrophy",
 *       "notes": null,
 *       "version": 3,
 *       "is_active": true,
 *       "archived_at": null,
 *       "updated_at": "2026-11-07T09:12:30.000000Z",
 *       "days_count": 3,
 *       "last_used_at": "2026-11-09T18:00:00.000000Z"
 *     }
 *
 * `last_used_at` is the start of the plan's latest finished workout, null
 * when it was never used (FEAT-3: it waited for the workouts to exist).
 *
 * The whole plan (GET /api/plans/{plan}; D1.4.7) has the same keys but
 * `days_count` and `last_used_at`, plus `days`: a list of PlanDayResource, each with its items
 * (PlanItemResource) and their sets (PlanSetResource).
 *
 * @mixin Plan
 */
class PlanResource extends JsonResource
{
    /**
     * The fields to send.
     *
     * @param  Request  $request  the current request; its user decides `is_active`
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'goal' => $this->goal,
            'notes' => $this->notes,
            // What the editor sends back when saving (D3.5.7)
            'version' => $this->version,
            // Whether it is the user's active plan: the Active badge, and
            // the list puts it first (D1.4.6). `?->`: null when nobody is
            // signed in, which never happens under auth:sanctum
            'is_active' => $request->user()?->active_plan_id === $this->id,
            // A date object, which JSON writes as text in ISO 8601, the
            // format JavaScript's new Date() reads; null when not archived
            'archived_at' => $this->archived_at,
            'updated_at' => $this->updated_at,
            // whenCounted(): only when the query asked for the count, with
            // withCount('days'), which adds a `days_count` column
            'days_count' => $this->whenCounted('days'),
            // whenHas(): only when the query added the column (withMax in
            // the list), null included. A subquery's result is the
            // database's text ("2026-11-09 18:00:00", in UTC), not a date
            // the model casts: Carbon reads it, toJSON() writes ISO 8601
            'last_used_at' => $this->whenHas('last_used_at', fn (?string $value) => $value === null ? null : Carbon::parse($value)->toJSON()),
            // collection(): PlanDayResource applied to each day. With the
            // days not loaded, whenLoaded() gives a "missing" value and the
            // key is left out
            'days' => PlanDayResource::collection($this->whenLoaded('days')),
        ];
    }
}
