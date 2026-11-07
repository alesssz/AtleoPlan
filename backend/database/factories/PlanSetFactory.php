<?php

namespace Database\Factories;

// Imports: the enum of set_type, the models used below, and Laravel's base
// Factory
use App\Enums\SetType;
use App\Models\PlanItem;
use App\Models\PlanSet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake planned sets for tests: by default a normal set of 8–10 reps at
 * 80 kg. Usually created through an item,
 * `PlanItem::factory()->has(PlanSet::factory()->count(3), 'sets')`.
 *
 * @extends Factory<PlanSet>
 */
class PlanSetFactory extends Factory
{
    /**
     * A normal set of 8–10 reps at 80 kg.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plan_item_id' => PlanItem::factory(),
            'position' => 0,
            'set_type' => SetType::Normal,
            'target_reps_min' => 8,
            'target_reps_max' => 10,
            'target_weight_kg' => '80.000',
        ];
    }

    /**
     * A warm-up set: `PlanSet::factory()->warmUp()`.
     */
    public function warmUp(): static
    {
        return $this->state(fn (array $attributes) => [
            'set_type' => SetType::WarmUp,
            'target_reps_min' => 10,
            'target_reps_max' => 10,
            'target_weight_kg' => '40.000',
        ]);
    }
}
