<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\PlanDay;
use App\Models\PlanItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A new public exercise by default; `->for($bench)` uses an existing one.
 *
 * @extends Factory<PlanItem>
 */
class PlanItemFactory extends Factory
{
    /**
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
