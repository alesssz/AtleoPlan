<?php

/**
 * A user disabled by an admin while signed in is signed out at their next
 * request (BE-2, the middleware SignOutDisabledAccount,
 * docs/concepts/C2-backend.md C2.7.9). Signing in again is refused, as
 * SignInTest and GoogleSignInTest check.
 *
 * The scenarios sign in through the real route, as the React app does, then
 * an admin disables the account (here: the column set directly), then the
 * React app asks for something. The session is the test's own (the `array`
 * driver of phpunit.xml), kept from one request to the next.
 */

// Imports: the model, and the trait that empties the database
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Scenario: signed in on the phone, disabled from the panel, then the app
// asks who is signed in
it('signs out a user disabled since signing in', function () {
    // Ann, signed in through the real route, as the React app does
    $user = User::factory()->create(['email' => 'ann@example.com']);
    $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => 'password'])->assertOk();
    $this->getJson('/api/user')->assertOk();

    // What the panel's Disable does (ChangeUserAccess)
    $user->forceFill(['disabled_at' => now()])->save();
    // A real request starts a new PHP process, which reads the user from the
    // database. A test keeps one app for all its requests, and its guards
    // keep the user they read at sign-in, still enabled: forgetGuards()
    // drops them, so the next request reads the user again, as a real one does
    $this->app['auth']->forgetGuards();

    // 401: the React app reads it as "the session has ended" and opens sign-in
    $this->getJson('/api/user')->assertUnauthorized();
    $this->assertGuest();
});

it('signs them out of every route, not only /api/user', function () {
    // A user signed in, then disabled
    $user = User::factory()->create();
    $this->actingAs($user);
    $user->forceFill(['disabled_at' => now()])->save();

    $this->getJson('/api/plans')->assertUnauthorized();
    $this->getJson('/api/exercises')->assertUnauthorized();
});

it('leaves an enabled user signed in', function () {
    // A user who stays enabled
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/user')->assertOk();
    $this->assertAuthenticatedAs($user);
});

it('lets a disabled user still reach the public routes, as a visitor', function () {
    // A user already disabled, with a session still open
    $user = User::factory()->disabled()->create();

    $this->actingAs($user)->getJson('/api/health')->assertOk();
    $this->assertGuest();
});
