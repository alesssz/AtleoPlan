<?php

/**
 * Confirming the address (app/Http/Controllers/EmailVerificationController.php):
 * the email sent at sign-up, the app closed until its link is opened, the link
 * itself, sending it again, and the other ways an address is proved.
 */

use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * The link of the confirmation email sent to this user, as a path: it holds
 * the React app's address, which Vite forwards here.
 */
function verificationPath(User $user): string
{
    $url = (new VerifyEmail)->toMail($user)->viewData['url'];

    expect($url)->toStartWith(config('app.frontend_url').'/auth/verify-email/');

    return Str::after($url, config('app.frontend_url'));
}

describe('signing up', function () {
    it('emails the link, in the account\'s language', function () {
        $this->postJson('/api/auth/register', [
            'name' => 'Ann',
            'email' => 'ann@example.com',
            'password' => 'long-enough-password',
            'password_confirmation' => 'long-enough-password',
            'locale' => 'it',
        ])->assertCreated();

        $sent = Mail::mailer('array')->getSymfonyTransport()->messages()->last();
        $email = $sent->getOriginalMessage();
        expect($sent->getEnvelope()->getRecipients()[0]->getAddress())->toBe('ann@example.com')
            ->and($email->getSubject())->toBe('Conferma il tuo indirizzo email')
            // The app's own layout, with the button and the address to copy
            ->and($email->getHtmlBody())
            ->toContain('Ti diamo il benvenuto in AtleoPlan!')
            ->toContain('<span style="color:#ededf2; white-space:nowrap;">ann@example.com</span>')
            ->toContain('http://localhost:5673/email-logo.png')
            ->toContain('Se il pulsante non funziona')
            ->not->toContain('Laravel')
            // And a plain-text part with the link
            ->and($email->getTextBody())->toContain('Conferma l\'indirizzo: http://localhost:5673/auth/verify-email/');
        expect(User::sole()->hasVerifiedEmail())->toBeFalse();
    });
});

describe('until the address is confirmed', function () {
    it('opens only the account itself, and answers 403 to the rest', function () {
        $user = User::factory()->unverified()->create();
        $this->actingAs($user);

        $this->getJson('/api/user')->assertOk()->assertJsonPath('data.email_verified', false);
        $this->patchJson('/api/user/preferences', ['theme' => 'light'])->assertNoContent();
        foreach (['/api/home', '/api/plans', '/api/exercises', '/api/sessions'] as $path) {
            $this->getJson($path)->assertForbidden();
        }
        $this->postJson('/api/plans', [])->assertForbidden();
    });

    it('opens everything once confirmed', function () {
        $this->actingAs(User::factory()->create())->getJson('/api/home')->assertOk();
    });
});

describe('the link', function () {
    it('confirms the address without a session, from any browser', function () {
        Event::fake([Verified::class]);
        $user = User::factory()->unverified()->create();

        $this->get(verificationPath($user))->assertRedirect(config('app.frontend_url').'/login?verify=done');

        $this->assertGuest();
        expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
        Event::assertDispatched(Verified::class);
    });

    it('takes a second click as the first', function () {
        $user = User::factory()->unverified()->create();
        $path = verificationPath($user);
        $this->get($path);
        $at = $user->fresh()->email_verified_at;

        $this->travel(5)->minutes();
        $this->get($path)->assertRedirect(config('app.frontend_url').'/login?verify=done');

        expect($user->fresh()->email_verified_at->equalTo($at))->toBeTrue();
    });

    it('refuses a link that has expired', function () {
        $user = User::factory()->unverified()->create();
        $path = verificationPath($user);

        $this->travel(config('auth.verification.expire', 60) + 1)->minutes();

        $this->get($path)->assertRedirect(config('app.frontend_url').'/login?verify=failed');
        expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    });

    it('refuses a link changed by hand', function (Closure $change) {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();

        $this->get($change(verificationPath($user), $user, $other))
            ->assertRedirect(config('app.frontend_url').'/login?verify=failed');

        expect($user->fresh()->hasVerifiedEmail())->toBeFalse()
            ->and($other->fresh()->hasVerifiedEmail())->toBeFalse();
    })->with([
        'another user\'s id' => [fn (string $path, User $user, User $other) => str_replace("/{$user->id}/", "/{$other->id}/", $path)],
        'without its signature' => [fn (string $path) => Str::before($path, '&signature=')],
        'a later expiry' => [fn (string $path) => preg_replace('/expires=\d+/', 'expires=9999999999', $path)],
    ]);
});

describe('sending it again', function () {
    it('sends the link again, to an address not yet confirmed', function () {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->postJson('/api/user/verification-email')->assertNoContent();

        Notification::assertSentTo($user, VerifyEmail::class);
    });

    it('sends nothing for an address already confirmed', function () {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/user/verification-email')->assertNoContent();

        Notification::assertNothingSent();
    });

    it('sends a few an hour, then 429', function () {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        for ($i = 0; $i < AppServiceProvider::VERIFICATION_EMAILS_PER_HOUR; $i++) {
            $this->actingAs($user)->postJson('/api/user/verification-email')->assertNoContent();
        }

        $this->actingAs($user)->postJson('/api/user/verification-email')->assertTooManyRequests();
        Notification::assertSentToTimes($user, VerifyEmail::class, AppServiceProvider::VERIFICATION_EMAILS_PER_HOUR);
    });

    it('answers 401 to a visitor', function () {
        $this->postJson('/api/user/verification-email')->assertUnauthorized();
    });
});

describe('a password reset', function () {
    it('confirms the address, and signs out whoever held the account', function () {
        $user = User::factory()->unverified()->create(['email' => 'ann@example.com', 'remember_token' => 'theirs']);
        DB::table('sessions')->insert(['id' => 'theirs', 'user_id' => $user->id, 'payload' => '', 'last_activity' => now()->timestamp]);

        $this->postJson('/api/auth/reset-password', [
            'token' => Password::createToken($user),
            'email' => 'ann@example.com',
            'password' => 'a-new-long-password',
            'password_confirmation' => 'a-new-long-password',
        ])->assertOk();

        $user->refresh();
        expect($user->hasVerifiedEmail())->toBeTrue()
            ->and($user->remember_token)->not->toBe('theirs')
            ->and(DB::table('sessions')->where('id', 'theirs')->exists())->toBeFalse();
    });
});
