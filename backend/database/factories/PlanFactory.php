<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A plan with no days, owned by a new user. Tests add the levels they need:
 *
 *     Plan::factory()->for($user)->has(
 *         PlanDay::factory()->has(PlanItem::factory()->has(PlanSet::factory()->count(3), 'sets'), 'items'),
 *         'days',
 *     )->create();
 *
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Push Pull Legs', 'Full body', 'Upper lower', 'Strength 5x5']),
            'goal' => null,
            'notes' => null,
            'version' => 1,
        ];
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'archived_at' => now(),
        ]);
    }
}
