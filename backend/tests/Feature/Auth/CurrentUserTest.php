<?php

/**
 * The signed-in user's own account: GET /api/user and
 * PATCH /api/user/preferences (app/Http/Controllers/CurrentUserController.php).
 */

use App\Enums\Locale;
use App\Enums\Theme;
use App\Enums\WeightUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('answers 401 to a visitor', function () {
    $this->getJson('/api/user')->assertUnauthorized();
    $this->patchJson('/api/user/preferences', ['theme' => 'light'])->assertUnauthorized();
});

it('returns the signed-in user, without anything secret', function () {
    $user = User::factory()->create(['name' => 'Ann', 'locale' => Locale::It]);

    $this->actingAs($user)->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('data.name', 'Ann')
        ->assertJsonPath('data.locale', 'it')
        ->assertJsonPath('data.theme', 'dark')
        ->assertJsonPath('data.is_admin', false)
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.remember_token');
});

it('saves the theme alone, leaving the language as it is', function () {
    $user = User::factory()->create(['locale' => Locale::It]);

    $this->actingAs($user)->patchJson('/api/user/preferences', ['theme' => 'light'])
        ->assertNoContent();

    expect($user->fresh())
        ->theme->toBe(Theme::Light)
        ->locale->toBe(Locale::It);
});

it('saves the language', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/user/preferences', ['locale' => 'de'])
        ->assertNoContent();

    expect($user->fresh()->locale)->toBe(Locale::De);
});

it('refuses values outside the lists', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/user/preferences', ['theme' => 'pink', 'locale' => 'fr'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['theme', 'locale']);
});

it('ignores anything that is not a preference', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patchJson('/api/user/preferences', ['theme' => 'light', 'is_admin' => true, 'email' => 'new@example.com'])
        ->assertNoContent();

    expect($user->fresh())
        ->is_admin->toBeFalse()
        ->email->toBe($user->email);
});

it('saves the workout preferences, one at a time', function () {
    $user = User::factory()->create();

    // Each request sends one, as the Profile's rows do
    foreach ([['weight_unit' => 'lb'], ['default_rest_seconds' => 120], ['weight_step' => '1.25'], ['timer_sound' => false], ['timer_vibration' => false]] as $change) {
        $this->actingAs($user)->patchJson('/api/user/preferences', $change)->assertNoContent();
    }

    expect($user->fresh())
        ->weight_unit->toBe(WeightUnit::Lb)
        ->default_rest_seconds->toBe(120)
        ->weight_step->toBe('1.25')
        ->timer_sound->toBeFalse()
        ->timer_vibration->toBeFalse();
});

it('refuses workout preferences out of range', function () {
    $user = User::factory()->create();

    // A unit not in the list, a rest over 10 minutes, a step too small and
    // one with three decimals, a sound that is not true or false
    $this->actingAs($user)->patchJson('/api/user/preferences', ['weight_unit' => 'st', 'default_rest_seconds' => 601, 'weight_step' => 0.1, 'timer_sound' => 'loud'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['weight_unit', 'default_rest_seconds', 'weight_step', 'timer_sound']);
    $this->actingAs($user)->patchJson('/api/user/preferences', ['weight_step' => 1.125])
        ->assertJsonValidationErrors(['weight_step']);

    // Nothing changed
    expect($user->fresh())
        ->weight_unit->toBe(WeightUnit::Kg)
        ->weight_step->toBe('2.50');
});
