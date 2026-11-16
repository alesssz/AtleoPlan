<?php

/**
 * A user disabled by an admin while signed in is signed out at their next
 * request (the middleware SignOutDisabledAccount). Signing in again is refused,
 * as SignInTest and GoogleSignInTest check.
 */

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('signs out a user disabled since signing in', function () {
    // Ann, signed in through the real route, as the React app does
    $user = User::factory()->create(['email' => 'ann@example.com']);
    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'password'])->assertOk();
    $this->getJson('/api/user')->assertOk();

    // What the panel's Disable does (ChangeUserAccess)
    $user->forceFill(['disabled_at' => now()])->save();
    // A test keeps one app across requests, and its guards keep the user
    // they read at sign-in, still enabled; a real request would read the
    // user again
    $this->app['auth']->forgetGuards();

    // 401: the React app reads it as "the session has ended" and opens sign-in
    $this->getJson('/api/user')->assertUnauthorized();
    $this->assertGuest();
});

it('signs them out of every route, not only /api/user', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->forceFill(['disabled_at' => now()])->save();

    $this->getJson('/api/plans')->assertUnauthorized();
    $this->getJson('/api/exercises')->assertUnauthorized();
});

it('leaves an enabled user signed in', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/user')->assertOk();
    $this->assertAuthenticatedAs($user);
});

it('lets a disabled user still reach the public routes, as a visitor', function () {
    $user = User::factory()->disabled()->create();

    $this->actingAs($user)->getJson('/api/health')->assertOk();
    $this->assertGuest();
});
