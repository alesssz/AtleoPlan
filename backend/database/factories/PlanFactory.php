<?php

namespace Database\Factories;

// Imports: the models used below, and Laravel's base Factory
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake plans for tests (what a factory is: UserFactory.php and
 * docs/how-to/H1-database.md H1.5).
 *
 * By default a plan with no days, owned by a new user. Tests add what they
 * need, level by level, with has():
 *
 *     Plan::factory()->for($user)->has(
 *         PlanDay::factory()->has(PlanItem::factory()->has(PlanSet::factory()->count(3), 'sets'), 'items'),
 *         'days',
 *     )->create();
 *
 * - `for($user)` fills the belongsTo user();
 * - `has(…, 'days')` creates rows of the hasMany days(), with plan_id set;
 * - `->count(3)` makes three.
 *
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * A plan with a made-up name, version 1, not archived.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // User::factory() as a value: the user is created with the plan
            'user_id' => User::factory(),
            // One of these names, picked at random
            'name' => fake()->randomElement(['Push Pull Legs', 'Full body', 'Upper lower', 'Strength 5x5']),
            'goal' => null,
            'notes' => null,
            'version' => 1,
        ];
    }

    /**
     * An archived plan: `Plan::factory()->archived()`.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'archived_at' => now(),
        ]);
    }
}
