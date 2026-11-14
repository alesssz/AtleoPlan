<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\PlanDay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Usually created through a plan (PlanFactory shows the whole chain).
 *
 * @extends Factory<PlanDay>
 */
class PlanDayFactory extends Factory
{
    /**
     * At position 0: tests that need an order give it,
     * `->sequence(['position' => 0], ['position' => 1])`.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plan_id' => Plan::factory(),
            'name' => 'Day '.fake()->randomLetter(),
            'position' => 0,
        ];
    }
}
