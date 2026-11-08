<?php

namespace App\Http\Resources;

// Imports: the model it describes, the request, and Laravel's base resource
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The JSON shape of a workout. One class for the list and for a whole
 * session: the keys of what was not loaded are left out.
 *
 *     {
 *       "id": "0192…",
 *       "plan_id": "0192…", "plan_day_id": "0192…",
 *       "plan_name": "Push Pull Legs", "day_name": "Day A – Push",
 *       "started_at": "2026-11-09T17:00:00.000000Z",
 *       "finished_at": "2026-11-09T18:02:00.000000Z",
 *       "duration_seconds": 3540, "feeling": 4, "notes": null,
 *       "updated_at": "…",
 *       "exercises_done": 5, "sets_done": 18, "reps_done": 142, "volume_kg": "5240.000",
 *       "exercises": [ …SessionExerciseResource… ]
 *     }
 *
 * - The four totals are there when the query asked for them
 *   (WorkoutSession::withTotals()): worked out by the database, warm-ups
 *   excluded, never stored (docs/design/D3-data-model.md D3.8).
 * - `volume_kg` is text with three decimals, exact like every weight, and
 *   always in kilograms: the app converts to pounds for showing.
 * - `exercises` is there when the whole session was loaded.
 *
 * @mixin WorkoutSession
 */
class WorkoutSessionResource extends JsonResource
{
    /**
     * The fields to send.
     *
     * @param  Request  $request  the current request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan_id' => $this->plan_id,
            'plan_day_id' => $this->plan_day_id,
            'plan_name' => $this->plan_name,
            'day_name' => $this->day_name,
            'started_at' => $this->started_at,
            'finished_at' => $this->finished_at,
            'duration_seconds' => $this->duration_seconds,
            'feeling' => $this->feeling,
            'notes' => $this->notes,
            'updated_at' => $this->updated_at,
            // whenHas(): only when the row has that column, which it does
            // when the query added it with withTotals()
            'exercises_done' => $this->whenHas('exercises_done', fn () => (int) $this->exercises_done),
            'sets_done' => $this->whenHas('sets_done', fn () => (int) $this->sets_done),
            'reps_done' => $this->whenHas('reps_done', fn () => (int) $this->reps_done),
            // Postgres gives the product of two numeric(7,3) with six
            // decimals ("5240.000000"): three are kept, as for every weight
            'volume_kg' => $this->whenHas('volume_kg', fn () => number_format((float) $this->volume_kg, 3, '.', '')),
            'exercises' => SessionExerciseResource::collection($this->whenLoaded('sessionExercises')),
        ];
    }
}
