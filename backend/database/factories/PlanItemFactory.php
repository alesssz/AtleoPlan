<?php

namespace Database\Factories;

// Imports: the models used below, and Laravel's base Factory
use App\Models\Exercise;
use App\Models\PlanDay;
use App\Models\PlanItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake plan items for tests: one exercise in one day. By default a new
 * public exercise; `->for($bench)` uses an existing one (PlanFactory shows
 * the whole chain).
 *
 * @extends Factory<PlanItem>
 */
class PlanItemFactory extends Factory
{
    /**
     * An item with a new public exercise, a 90-second rest, not in a superset.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plan_day_id' => PlanDay::factory(),
            'exercise_id' => Exercise::factory(),
            'position' => 0,
            'superset_group' => null,
            'rest_seconds' => 90,
            'notes' => null,
            'for_time' => false,
        ];
    }
}
