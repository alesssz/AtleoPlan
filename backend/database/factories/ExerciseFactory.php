<?php

namespace Database\Factories;

use App\Enums\LoggingType;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A public exercise with no equipment and no muscles. Tests add what they need:
 * - `Exercise::factory()->personal()->create()`: owned by a new user;
 * - `Exercise::factory()->for($user, 'owner')->create()`: owned by $user;
 * - `Exercise::factory()->for($barbell)->create()`: with that equipment;
 * - `Exercise::factory()->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')->create()`:
 *   with a row in exercise_muscle.
 *
 * @extends Factory<Exercise>
 */
class ExerciseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucfirst(fake()->words(2, true));

        return [
            'name' => ['en' => $name, 'it' => $name.' (it)'],
            // The table's defaults, which a new model does not read back
            'logging_type' => LoggingType::WeightReps,
            'machine_translated' => [],
        ];
    }

    /**
     * Owned by a new user.
     */
    public function personal(): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_id' => User::factory(),
        ]);
    }
}
