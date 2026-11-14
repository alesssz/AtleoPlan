<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\SessionExercise;
use App\Models\WorkoutSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A new public exercise in a new workout, with no sets.
 *
 * @extends Factory<SessionExercise>
 */
class SessionExerciseFactory extends Factory
{
    /**
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
