<?php

/**
 * Signing in with Google: the two routes of
 * app/Http/Controllers/GoogleSignInController.php and the cases of
 * app/Actions/Auth/SignInWithSocialAccount.php.
 *
 * Google is never called: Socialite::fake() stands in for it, so these tests
 * cover what the app does with Google's answer. The keys given to
 * SocialiteUser::fake() also land in getRaw(), where `email_verified` is read.
 */

use App\Enums\Locale;
use App\Enums\SocialProvider;
use App\Models\Plan;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

// So the tests do not depend on this computer's backend/.env
beforeEach(function () {
    config([
        'services.google.client_id' => 'test-client-id',
        'services.google.client_secret' => 'test-client-secret',
    ]);
});

/**
 * A person as Google describes them, with a verified address unless told otherwise.
 *
 * @param  array<string, mixed>  $attributes  what to change, e.g. ['email_verified' => false]
 */
function googlePerson(array $attributes = []): SocialiteUser
{
    return SocialiteUser::fake([
        'id' => '109876543210987654321',
        'name' => 'Ann Example',
        'email' => 'ann@example.com',
        'email_verified' => true,
        ...$attributes,
    ]);
}

/**
 * Where the browser is sent back to on the React app.
 *
 * @param  string  $path  the path, e.g. '/plans' or '/login?error=failed'
 */
function frontend(string $path): string
{
    return config('app.frontend_url').$path;
}

describe('the way to Google', function () {
    it('sends the browser to Google, keeping the page and the language', function () {
        Socialite::fake('google');

        $this->get('/auth/google/redirect?from=/plans&locale=it')
            ->assertRedirect('https://socialite.fake/google/authorize')
            ->assertSessionHas('google_sign_in', ['from' => '/plans', 'locale' => 'it', 'admin' => false]);
    });

    it('keeps only a path of this app, and only one of our languages', function (string $from) {
        Socialite::fake('google');

        $this->get('/auth/google/redirect?from='.urlencode($from).'&locale=fr')
            ->assertRedirect('https://socialite.fake/google/authorize')
            ->assertSessionHas('google_sign_in', ['from' => null, 'locale' => null, 'admin' => false]);
    })->with([
        // Each would lead the browser to another site after signing in
        'another site' => 'https://evil.example/plans',
        'two slashes' => '//evil.example',
        'a backslash' => '/\\evil.example',
        'a line break' => "/plans\nLocation: https://evil.example",
        'not a path' => 'plans',
    ]);

    it('stays in the app when Google is not set up on this computer', function () {
        config(['services.google.client_id' => null]);

        $this->get('/auth/google/redirect')->assertRedirect(frontend('/login?error=failed'));
    });
});

describe('back from Google', function () {
    it('creates an account for a new address and signs it in', function () {
        Socialite::fake('google', googlePerson(['email' => 'Ann@Example.com']));

        // What the first stop would have kept
        $this->withSession(['google_sign_in' => ['from' => '/plans', 'locale' => 'it']])
            ->get('/auth/google/callback')
            ->assertRedirect(frontend('/plans'));

        $user = User::sole();
        expect($user->name)->toBe('Ann Example')
            // In lowercase, as Fortify keeps every address
            ->and($user->email)->toBe('ann@example.com')
            ->and($user->locale)->toBe(Locale::It)
            ->and($user->email_verified_at)->not->toBeNull()
            ->and($user->password)->toBeNull()
            // Remembered, as with a password: a phone at the gym stays signed in
            ->and($user->remember_token)->not->toBeNull();
        expect($user->socialAccounts()->sole())
            ->provider->toBe(SocialProvider::Google)
            ->provider_user_id->toBe('109876543210987654321');
        $this->assertAuthenticatedAs($user);
    });

    it('lands on Home when no page was asked for', function () {
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback')->assertRedirect(frontend('/'));

        $this->assertAuthenticated();
    });

    it('signs the same Google account into the same user every time', function () {
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback');
        auth()->logout();
        $this->get('/auth/google/callback');

        expect(User::count())->toBe(1)
            ->and(SocialAccount::count())->toBe(1);
    });

    it('finds a linked account by its Google id, even after the address changed on Google', function () {
        $user = User::factory()->create(['email' => 'ann@example.com']);
        SocialAccount::factory()->for($user)->create(['provider_user_id' => '42']);
        Socialite::fake('google', googlePerson(['id' => '42', 'email' => 'ann.new@example.com']));

        $this->get('/auth/google/callback')->assertRedirect(frontend('/'));

        $this->assertAuthenticatedAs($user);
        expect(User::count())->toBe(1);
    });

    it('links Google to an account that already has this address, keeping its plans', function () {
        $user = User::factory()->unverified()->create(['email' => 'ann@example.com']);
        Plan::factory()->for($user)->create();
        // The password's hash before: it must not change
        $passwordHash = $user->password;
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback')->assertRedirect(frontend('/'));

        $this->assertAuthenticatedAs($user);
        $user->refresh();
        expect($user->password)->toBe($passwordHash)
            ->and($user->plans()->count())->toBe(1)
            // Google has shown the address is theirs
            ->and($user->email_verified_at)->not->toBeNull()
            ->and($user->socialAccounts()->count())->toBe(1)
            ->and(User::count())->toBe(1);
    });

    it('refuses an address Google has not verified, and links nothing', function () {
        $user = User::factory()->create(['email' => 'ann@example.com']);
        Socialite::fake('google', googlePerson(['email_verified' => false]));

        $this->get('/auth/google/callback')->assertRedirect(frontend('/login?error=unverified'));

        $this->assertGuest();
        expect($user->socialAccounts()->count())->toBe(0)
            ->and(User::count())->toBe(1);
    });

    it('creates no account for an address Google has not verified', function () {
        Socialite::fake('google', googlePerson(['email_verified' => false]));

        $this->get('/auth/google/callback')->assertRedirect(frontend('/login?error=unverified'));

        expect(User::count())->toBe(0);
    });

    it('refuses a disabled account, linked or not', function (bool $linked) {
        $user = User::factory()->disabled()->create(['email' => 'ann@example.com']);
        if ($linked) {
            SocialAccount::factory()->for($user)->create(['provider_user_id' => '109876543210987654321']);
        }
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback')->assertRedirect(frontend('/login?error=disabled'));

        $this->assertGuest();
        // Nothing new was linked to it
        expect($user->socialAccounts()->count())->toBe($linked ? 1 : 0);
    })->with(['linked' => true, 'by its address' => false]);

    it('says the person cancelled on Google\'s page', function () {
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback?error=access_denied')
            ->assertRedirect(frontend('/login?error=cancelled'));

        $this->assertGuest();
    });

    it('says something went wrong for any other error of Google', function () {
        Socialite::fake('google', googlePerson());

        $this->get('/auth/google/callback?error=admin_policy_enforced')
            ->assertRedirect(frontend('/login?error=failed'));
    });

    it('says something went wrong when Socialite refuses the visit', function () {
        // What Socialite throws when the state does not match (a visit
        // opened twice, expired, or started on another site)
        Socialite::fake('google', fn () => throw new InvalidStateException);

        $this->get('/auth/google/callback?code=x&state=y')
            ->assertRedirect(frontend('/login?error=failed'));

        $this->assertGuest();
    });
});

// The admin panel's login page has its own "Continue with Google", for an admin
// with no password: the same two stops, with to=admin
describe('from the admin panel', function () {
    it('remembers that the visit started on the panel, from the exact word only', function (string $to, bool $admin) {
        Socialite::fake('google');

        $this->get('/auth/google/redirect?to='.urlencode($to))
            ->assertSessionHas('google_sign_in.admin', $admin);
    })->with([
        'admin' => ['admin', true],
        // An address is never followed: only the word is read
        'an address' => ['https://evil.example/admin', false],
        'another word' => ['plans', false],
    ]);

    it('takes an admin back to the panel', function () {
        User::factory()->admin()->create(['email' => 'ann@example.com']);
        Socialite::fake('google', googlePerson());

        $this->withSession(['google_sign_in' => ['admin' => true]])
            ->get('/auth/google/callback')
            ->assertRedirect(config('app.admin_url'));

        $this->assertAuthenticated();
    });

    it('takes someone who is not an admin into the app, signed in', function () {
        User::factory()->create(['email' => 'ann@example.com']);
        Socialite::fake('google', googlePerson());

        $this->withSession(['google_sign_in' => ['admin' => true]])
            ->get('/auth/google/callback')
            ->assertRedirect(frontend('/'));

        $this->assertAuthenticated();
    });

    it('brings an error back to the panel\'s login page', function () {
        User::factory()->admin()->disabled()->create(['email' => 'ann@example.com']);
        Socialite::fake('google', googlePerson());

        $this->withSession(['google_sign_in' => ['admin' => true]])
            ->get('/auth/google/callback')
            ->assertRedirect(config('app.admin_url').'/login?google_error=disabled');

        $this->assertGuest();
    });

    it('shows the button, and the error, on the panel\'s login page', function () {
        $this->get('/admin/login?google_error=cancelled')
            ->assertOk()
            ->assertSee('Continue with Google')
            ->assertSee('/auth/google/redirect?to=admin&amp;locale=en', escape: false)
            ->assertSee('Signing in with Google was cancelled.', escape: false);
    });

    it('hides the button when Google is not set up on this computer', function () {
        config(['services.google.client_id' => null]);

        $this->get('/admin/login')->assertOk()->assertDontSee('Continue with Google');
    });
});

describe('an account without a password', function () {
    it('cannot be signed into with an email and a password', function () {
        User::factory()->create(['email' => 'ann@example.com', 'password' => null]);

        // Not even an empty password: Hash::check() never matches an empty hash
        foreach (['', 'password'] as $password) {
            $this->postJson('/api/auth/login', ['email' => 'ann@example.com', 'password' => $password])
                ->assertUnprocessable();
        }

        $this->assertGuest();
    });

    it('goes with its user', function () {
        // A Google account linked to a user the factory makes
        $account = SocialAccount::factory()->create();

        $account->user->delete();

        // cascadeOnDelete() in the migration
        expect(SocialAccount::count())->toBe(0);
    });
});
