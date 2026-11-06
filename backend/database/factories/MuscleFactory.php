<?php

namespace Database\Factories;

// Imports: the model this factory builds, and Laravel's base Factory
use App\Models\Muscle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake muscles for tests (what a factory is: UserFactory.php and
 * docs/how-to/H1-database.md H1.5). The real 17 come from MuscleSeeder; a
 * test that needs a specific one gives its own values:
 * `Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest']])`.
 *
 * @extends Factory<Muscle>
 */
class MuscleFactory extends Factory
{
    /**
     * A muscle with a random one-word slug and its name in two languages.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // A random word; unique() never repeats it in one test, because slug
        // is a unique column
        $word = fake()->unique()->word();

        return [
            'slug' => $word,
            // An array for a translatable column: one value per language
            'name' => ['en' => ucfirst($word), 'it' => ucfirst($word).' (it)'],
        ];
    }
}
