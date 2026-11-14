<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A finished free workout of an hour, with no exercises.
 *
 * @extends Factory<WorkoutSession>
 */
class WorkoutSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'started_at' => now()->subHour(),
            'finished_at' => now(),
            'duration_seconds' => 3600,
        ];
    }

    /**
     * Still in progress.
     */
    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'finished_at' => null,
            'duration_seconds' => null,
        ]);
    }
}
