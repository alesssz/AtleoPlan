<?php

/**
 * Signing in and out through Fortify's routes: what the React app sends and
 * what it gets back, not Fortify's internals. UserFactory's password is
 * `password`.
 */

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('signs in with the right password and remembers the user', function () {
    $user = User::factory()->create(['email' => 'ann@example.com', 'remember_token' => null]);

    // `remember` is what the React app always sends: a phone at the gym must not
    // be signed out after two hours
    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'password', 'remember' => true])
        ->assertOk();

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->remember_token)->not->toBeNull();
});

it('accepts the email in any case', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/login', ['email' => 'ANN@Example.com', 'password' => 'password'])
        ->assertOk();

    $this->assertAuthenticatedAs($user);
});

it('refuses a wrong password, with the error on the email field', function () {
    User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->assertGuest();
});

it('refuses an unknown email with the same message as a wrong password', function () {
    User::factory()->create(['email' => 'ann@example.com']);

    // The two answers must be the same, or the form would reveal who has an account
    $wrongPassword = $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong']);
    $unknownEmail = $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'wrong']);

    expect($unknownEmail->json('errors.email'))->toBe($wrongPassword->json('errors.email'));
});

it('refuses a disabled account, even with the right password', function () {
    User::factory()->disabled()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'This account has been disabled.');

    $this->assertGuest();
});

it('does not reveal a disabled account to someone without the password', function () {
    User::factory()->disabled()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

it('slows down password guessing', function () {
    User::factory()->create(['email' => 'ann@example.com']);

    // Five attempts a minute are allowed (FortifyServiceProvider)
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'wrong'])
            ->assertUnprocessable();
    }

    // The sixth is stopped before the password is even looked at
    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'password'])
        ->assertTooManyRequests();

    $this->assertGuest();
});

it('signs out', function () {
    $this->actingAs(User::factory()->create());

    $this->postJson('/api/auth/logout')->assertNoContent();

    $this->assertGuest('web');
});

it('refuses to sign out someone who is not signed in', function () {
    $this->postJson('/api/auth/logout')->assertUnauthorized();
});
