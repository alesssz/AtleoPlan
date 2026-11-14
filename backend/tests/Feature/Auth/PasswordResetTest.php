<?php

/**
 * "Forgot password", in its two steps: asking for the email, then choosing a
 * new password with the token it holds.
 */

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

it('emails a link that opens the React screen', function () {
    Notification::fake();
    $user = User::factory()->create(['email' => 'ann+gym@example.com']);

    $this->postJson('/api/auth/forgot-password', ['email' => 'ann+gym@example.com'])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        // The link's address, as it appears in the email
        $url = $notification->toMail($user)->actionUrl;

        return str_starts_with($url, 'http://localhost:5673/reset-password?token=')
            // The + must survive in the link
            && str_contains($url, 'email=ann%2Bgym%40example.com');
    });
});

it('says when the email is unknown', function () {
    $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('sets the new password with a valid token', function () {
    $user = User::factory()->create(['email' => 'ann@example.com']);
    // A real token, as the email would hold
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

    // The old password still works
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
