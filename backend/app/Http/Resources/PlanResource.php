<?php

namespace App\Http\Resources;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * The JSON shape of a plan. The same class serves the list and the whole
 * plan: the keys of what was not loaded are left out (whenLoaded,
 * whenCounted), so the list has `days_count` and the whole plan has `days`.
 *
 * In the list (GET /api/plans):
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
 * `last_used_at` is the start of the plan's latest finished workout, null when
 * it was never used.
 *
 * The whole plan (GET /api/plans/{plan}) has the same keys but `days_count` and
 * `last_used_at`, plus `days`: a list of PlanDayResource, each with its items
 * (PlanItemResource) and their sets (PlanSetResource).
 *
 * @mixin Plan
 */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'goal' => $this->goal,
            'notes' => $this->notes,
            // What the editor sends back when saving
            'version' => $this->version,
            'is_active' => $request->user()?->active_plan_id === $this->id,
            'archived_at' => $this->archived_at,
            'updated_at' => $this->updated_at,
            'days_count' => $this->whenCounted('days'),
            // A subquery's value is the database's text, not a cast date
            'last_used_at' => $this->whenHas('last_used_at', fn (?string $value) => $value === null ? null : Carbon::parse($value)->toJSON()),
            'days' => PlanDayResource::collection($this->whenLoaded('days')),
        ];
    }
}
