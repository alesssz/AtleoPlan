<?php

/**
 * The limit on every Fortify route (`fortify` in FortifyServiceProvider), on
 * top of the per-email one of signing in: per address for visitors, per user
 * once signed in.
 */

use App\Models\User;
use App\Providers\FortifyServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

it('stops one address trying passwords on many accounts', function () {
    // A different email each time: the per-email limit never trips
    for ($i = 0; $i < FortifyServiceProvider::AUTH_REQUESTS_PER_MINUTE; $i++) {
        $this->postJson('/api/auth/login', ['email' => "user{$i}@example.com", 'password' => 'wrong'])
            ->assertUnprocessable();
    }

    $this->postJson('/api/auth/login', ['email' => 'another@example.com', 'password' => 'wrong'])
        ->assertTooManyRequests();
    // Another address is not held up
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
        ->postJson('/api/auth/login', ['email' => 'another@example.com', 'password' => 'wrong'])
        ->assertUnprocessable();
});

it('counts signing up and reset emails with signing in, per address', function () {
    Notification::fake();
    User::factory()->create(['email' => 'ann@example.com']);

    for ($i = 0; $i < FortifyServiceProvider::AUTH_REQUESTS_PER_MINUTE - 1; $i++) {
        $this->postJson('/api/auth/register', [])->assertUnprocessable();
    }
    $this->postJson('/api/auth/forgot-password', ['email' => 'ann@example.com'])->assertOk();

    $this->postJson('/api/auth/forgot-password', ['email' => 'ann@example.com'])->assertTooManyRequests();
    $this->postJson('/api/auth/register', [])->assertTooManyRequests();
});

it('limits confirming the password per user, from any address', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < FortifyServiceProvider::AUTH_REQUESTS_PER_MINUTE; $i++) {
        $this->actingAs($user)
            ->withServerVariables(['REMOTE_ADDR' => "10.0.1.{$i}"])
            ->postJson('/api/auth/user/confirm-password', ['password' => 'wrong'])
            ->assertUnprocessable();
    }

    $this->actingAs($user)
        ->withServerVariables(['REMOTE_ADDR' => '10.0.2.1'])
        ->postJson('/api/auth/user/confirm-password', ['password' => 'password'])
        ->assertTooManyRequests();
});

it('also limits per hour, with a count of its own', function () {
    $limits = RateLimiter::limiter('fortify')(Request::create('/'));

    expect(collect($limits)->map(fn (Limit $limit) => [$limit->maxAttempts, $limit->decaySeconds])->all())
        ->toBe([[FortifyServiceProvider::AUTH_REQUESTS_PER_MINUTE, 60], [FortifyServiceProvider::AUTH_REQUESTS_PER_HOUR, 3600]])
        ->and($limits[0]->key)->not->toBe($limits[1]->key);
});
