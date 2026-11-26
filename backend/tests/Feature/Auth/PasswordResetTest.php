<?php

/**
 * "Forgot password", in its two steps: asking for the email, then choosing a
 * new password with the token it holds.
 */

use App\Models\User;
use App\Notifications\ResetPasswordEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('emails a link that opens the React screen', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'ann+gym@example.com']);

    $this->postJson('/api/auth/forgot-password', ['email' => 'ann+gym@example.com'])->assertOk();

    Notification::assertSentTo($user, ResetPasswordEmail::class, function (ResetPasswordEmail $notification) use ($user) {
        $url = $notification->toMail($user)->viewData['url'];

        return str_starts_with($url, 'http://localhost:5673/reset-password?token=')
            // The + must survive in the link
            && str_contains($url, 'email=ann%2Bgym%40example.com');
    });
});

it('answers an address with no account, or one just asked for, as any other', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'ann@example.com']);

    $known = $this->postJson('/api/auth/forgot-password', ['email' => 'ann@example.com'])->assertOk();
    // The broker sends one email a minute per account: a second ask is refused
    $again = $this->postJson('/api/auth/forgot-password', ['email' => 'ann@example.com'])->assertOk();
    $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

    expect($unknown->json())->toBe($known->json())
        ->and($again->json())->toBe($known->json())
        ->and($known->json('message'))->toBe('If an account uses this email, we have sent it a link to reset the password.');
    Notification::assertSentToTimes($user, ResetPasswordEmail::class, 1);
});

it('still refuses what is not an address', function () {
    $this->postJson('/api/auth/forgot-password', ['email' => 'not an address'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('sends the email through the queue, so a known address answers no later', function () {
    Queue::fake();
    User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/forgot-password', ['email' => 'ann@example.com'])->assertOk();

    Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job) => $job->notification instanceof ResetPasswordEmail);
});

it('sets the new password with a valid token', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);
    $token = Password::createToken($user);

    $this->postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'ann@example.com',
        'password' => 'a-brand-new-password',
        'password_confirmation' => 'a-brand-new-password',
    ])->assertOk();

    expect(Hash::check('a-brand-new-password', $user->fresh()->password))->toBeTrue();
});

it('refuses a wrong token', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson('/api/auth/reset-password', [
        'token' => 'not-the-token',
        'email' => 'ann@example.com',
        'password' => 'a-brand-new-password',
        'password_confirmation' => 'a-brand-new-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

it('uses a token only once', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);
    $data = [
        'token' => Password::createToken($user),
        'email' => 'ann@example.com',
        'password' => 'a-brand-new-password',
        'password_confirmation' => 'a-brand-new-password',
    ];

    $this->postJson('/api/auth/reset-password', $data)->assertOk();
    $this->postJson('/api/auth/reset-password', $data)->assertUnprocessable();
});
