<?php

namespace Database\Factories;

// Imports: the enum of set_type, the models used below, and Laravel's base Factory
use App\Enums\SetType;
use App\Models\LoggedSet;
use App\Models\SessionExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake completed sets for tests: by default 8 reps at 80 kg.
 *
 * @extends Factory<LoggedSet>
 */
class LoggedSetFactory extends Factory
{
    /**
     * A normal set of 8 reps at 80 kg, completed now.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'session_exercise_id' => SessionExercise::factory(),
            'position' => 0,
            'set_type' => SetType::Normal,
            'weight_kg' => '80.000',
            'reps' => 8,
            'completed_at' => now(),
        ];
    }

    /**
     * A warm-up set of 10 reps at 40 kg: `LoggedSet::factory()->warmUp()`.
     */
    public function warmUp(): static
    {
        return $this->state(fn (array $attributes) => [
            'set_type' => SetType::WarmUp,
            'weight_kg' => '40.000',
            'reps' => 10,
        ]);
    }
}
