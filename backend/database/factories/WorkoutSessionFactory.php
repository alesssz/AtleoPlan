<?php

namespace Database\Factories;

// Imports: the models used below, and Laravel's base Factory
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake workouts for tests (what a factory is: UserFactory.php and
 * docs/how-to/H1-database.md H1.5). By default a free workout of an hour,
 * finished, owned by a new user, with no exercises. Tests add them with
 * has(SessionExercise::factory()…, 'sessionExercises').
 *
 * @extends Factory<WorkoutSession>
 */
class WorkoutSessionFactory extends Factory
{
    /**
     * A finished free workout: started an hour ago, lasting an hour.
     *
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
     * A workout still in progress: `WorkoutSession::factory()->open()`.
     */
    public function open(): static
    {
        return $this->state(fn (array $attributes) => [
            'finished_at' => null,
            'duration_seconds' => null,
        ]);
    }
}
