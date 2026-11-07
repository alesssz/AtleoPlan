<?php

namespace Database\Factories;

// Imports: the models used below, and Laravel's base Factory
use App\Models\Plan;
use App\Models\PlanDay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake plan days for tests. Usually created through a plan,
 * `Plan::factory()->has(PlanDay::factory()->count(2), 'days')`, which sets
 * plan_id (PlanFactory shows the whole chain).
 *
 * @extends Factory<PlanDay>
 */
class PlanDayFactory extends Factory
{
    /**
     * A day called "Day" and a random letter, such as "Day k", at position 0.
     * Tests that need an order give it: `->sequence(['position' => 0], ['position' => 1])`.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plan_id' => Plan::factory(),
            // A random letter: enough to tell days apart in a test
            'name' => 'Day '.fake()->randomLetter(),
            'position' => 0,
        ];
    }
}
