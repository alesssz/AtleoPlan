<?php

namespace Database\Factories;

use App\Enums\Locale;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Every fake user's password is `password`.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            // example.com addresses never reach a real inbox
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            // Hashed once: hashing is slow on purpose, and a test may create
            // many users
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            // The columns' defaults, which a new model does not read back
            'is_admin' => false,
            'locale' => Locale::En,
            'theme' => Theme::Dark,
            'weight_unit' => WeightUnit::Kg,
            'default_rest_seconds' => 90,
            'weight_step' => 2.5,
            'timer_sound' => true,
            'timer_vibration' => true,
            'show_rpe' => false,
        ];
    }

    /**
     * Factories bypass mass-assignment protection, so is_admin can be set here.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_admin' => true,
        ]);
    }

    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'disabled_at' => now(),
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
