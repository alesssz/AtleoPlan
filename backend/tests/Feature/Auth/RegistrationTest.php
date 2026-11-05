<?php

/**
 * Signing up: POST /api/auth/register, answered by Fortify, with the account
 * created by app/Actions/Fortify/CreateNewUser.php. docs/05-backend.md 5.7.3.
 */

use App\Enums\Locale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/**
 * A valid sign-up, with the given fields changed: each test states only what
 * it is about. `+` joins two arrays, the left one winning on repeated keys.
 *
 * @param  array<string, mixed>  $overrides  the fields to change
 * @return array<string, mixed>
 */
function signUpData(array $overrides = []): array
{
    return $overrides + [
        'name' => 'Ann',
        'email' => 'ann@example.com',
        'password' => 'long-enough-password',
        'password_confirmation' => 'long-enough-password',
    ];
}

it('creates the account and signs the user in', function () {
    $this->postJson('/api/auth/register', signUpData())->assertCreated();

    $user = User::where('email', 'ann@example.com')->sole();
    $this->assertAuthenticatedAs($user);
    // Never stored in clear
    expect($user->password)->not->toBe('long-enough-password')
        ->and(Hash::check('long-enough-password', $user->password))->toBeTrue();
});

it('saves the language sent by the app', function () {
    $this->postJson('/api/auth/register', signUpData(['locale' => 'de']))->assertCreated();

    expect(User::sole()->locale)->toBe(Locale::De);
});

it('falls back on the language of the request', function () {
    $this->withHeader('Accept-Language', 'it-IT,it;q=0.9')
        ->postJson('/api/auth/register', signUpData())
        ->assertCreated();

    expect(User::sole()->locale)->toBe(Locale::It);
});

it('stores the email in lowercase, so it can sign in again', function () {
    $this->postJson('/api/auth/register', signUpData(['email' => 'ANN@Example.com']))->assertCreated();

    expect(User::sole()->email)->toBe('ann@example.com');
});

it('refuses an email already in use, in any case', function () {
    User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/register', signUpData(['email' => 'ANN@example.com']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('never lets a request make someone an admin', function () {
    $this->postJson('/api/auth/register', signUpData(['is_admin' => true]))->assertCreated();

    expect(User::sole()->fresh()->is_admin)->toBeFalse();
});

// A dataset runs the test once per entry, with the entry's values as parameters
it('refuses invalid data', function (array $overrides, string $field) {
    $this->postJson('/api/auth/register', signUpData($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);

    expect(User::count())->toBe(0);
})->with([
    'no name' => [['name' => ''], 'name'],
    'not an email' => [['email' => 'not-an-email'], 'email'],
    'short password' => [['password' => 'short', 'password_confirmation' => 'short'], 'password'],
    'different confirmation' => [['password_confirmation' => 'something-else'], 'password'],
    'unknown language' => [['locale' => 'fr'], 'locale'],
]);
