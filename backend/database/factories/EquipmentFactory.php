<?php

namespace Database\Factories;

// Imports: the model this factory builds, and Laravel's base Factory
use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake equipment for tests; the same as MuscleFactory. The real 12
 * come from EquipmentSeeder.
 *
 * @extends Factory<Equipment>
 */
class EquipmentFactory extends Factory
{
    /**
     * Equipment with a random one-word slug and its name in two languages.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // A random word, never repeated in one test (slug is unique)
        $word = fake()->unique()->word();

        return [
            'slug' => $word,
            'name' => ['en' => ucfirst($word), 'it' => ucfirst($word).' (it)'],
        ];
    }
}
