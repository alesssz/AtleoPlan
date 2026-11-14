<?php

namespace Database\Factories;

use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * The real rows come from EquipmentSeeder.
 *
 * @extends Factory<Equipment>
 */
class EquipmentFactory extends Factory
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
