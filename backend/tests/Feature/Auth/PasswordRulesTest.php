<?php

/**
 * What a new password must be (Password::defaults() in AppServiceProvider),
 * at sign-up and at reset alike: long enough and, in production, not one
 * seen in a data leak.
 */

use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

/**
 * Signs up with the given password.
 */
function signUpWith(string $password): TestResponse
{
    return test()->postJson('/api/auth/register', [
        'name' => 'Ann',
        'email' => 'ann@example.com',
        'password' => $password,
        'password_confirmation' => $password,
    ]);
}

/**
 * Have I Been Pwned's answer for a range, holding the given password seen
 * `$count` times among other hashes.
 */
function pwnedRangeWith(string $password, int $count): string
{
    $suffix = substr(strtoupper(sha1($password)), 5);

    return "0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n{$suffix}:{$count}\r\n00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2";
}

it('wants at least ten characters at sign-up', function () {
    $short = str_repeat('a', AppServiceProvider::PASSWORD_MIN_LENGTH - 1);

    signUpWith($short)
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', 'The password field must be at least 10 characters.');
    signUpWith(str_repeat('a', AppServiceProvider::PASSWORD_MIN_LENGTH))->assertCreated();
});

it('wants the same at reset', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);
    $short = str_repeat('a', AppServiceProvider::PASSWORD_MIN_LENGTH - 1);

    $this->postJson('/api/auth/reset-password', [
        'token' => Password::createToken($user),
        'email' => 'ann@example.com',
        'password' => $short,
        'password_confirmation' => $short,
    ])->assertUnprocessable()->assertJsonValidationErrors('password');
});

it('asks nobody about leaks outside production', function () {
    Http::fake();

    signUpWith('long-enough-password')->assertCreated();

    Http::assertNothingSent();
});

describe('in production', function () {
    beforeEach(function () {
        app()->detectEnvironment(fn () => 'production');
        // Skipped by Laravel in tests only while the environment says so
        $this->withoutMiddleware(PreventRequestForgery::class);
    });

    it('refuses a password seen in a leak, sending only the start of its hash', function () {
        Http::fake(['api.pwnedpasswords.com/*' => Http::response(pwnedRangeWith('password1234', 3))]);

        signUpWith('password1234')
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'The given password has appeared in a data leak. Please choose a different password.');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.pwnedpasswords.com/range/'.substr(strtoupper(sha1('password1234')), 0, 5)
            && ! Str::contains($request->url(), 'password1234'));
    });

    it('takes a password not in the leaks', function () {
        Http::fake(['api.pwnedpasswords.com/*' => Http::response(pwnedRangeWith('another-one-entirely', 3))]);

        signUpWith('long-enough-password')->assertCreated();
    });

    it('lets the password through when the leak service does not answer', function () {
        Http::fake(fn () => throw new ConnectionException('No answer'));

        signUpWith('long-enough-password')->assertCreated();
    });
});
