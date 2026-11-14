<?php

namespace Database\Factories;

use App\Enums\SetType;
use App\Models\LoggedSet;
use App\Models\SessionExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A normal set of 8 reps at 80 kg, completed now.
 *
 * @extends Factory<LoggedSet>
 */
class LoggedSetFactory extends Factory
{
    /**
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
     * 10 reps at 40 kg.
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
