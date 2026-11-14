<?php

namespace Database\Factories;

use App\Models\Muscle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * The real rows come from MuscleSeeder; a test that needs a specific one
 * gives its own values:
 * `Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest']])`.
 *
 * @extends Factory<Muscle>
 */
class MuscleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // unique(): slug is a unique column
        $word = fake()->unique()->word();

        return [
            'slug' => $word,
            'name' => ['en' => ucfirst($word), 'it' => ucfirst($word).' (it)'],
        ];
    }
}
