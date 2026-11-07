<?php

namespace Database\Factories;

// Imports: the models used below, and Laravel's base Factory
use App\Models\Exercise;
use App\Models\SessionExercise;
use App\Models\WorkoutSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake exercises of a workout for tests: by default a new public
 * exercise in a new workout, with no sets. `->for($bench)` uses an existing
 * exercise; has(LoggedSet::factory()->count(3), 'sets') adds sets.
 *
 * @extends Factory<SessionExercise>
 */
class SessionExerciseFactory extends Factory
{
    /**
     * The first exercise of a new workout.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workout_session_id' => WorkoutSession::factory(),
            'exercise_id' => Exercise::factory(),
            'position' => 0,
        ];
    }
}
