<?php

namespace Database\Factories;

use App\Enums\SetType;
use App\Models\PlanItem;
use App\Models\PlanSet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A normal set of 8–10 reps at 80 kg.
 *
 * @extends Factory<PlanSet>
 */
class PlanSetFactory extends Factory
{
    /**
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
