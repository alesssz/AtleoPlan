<?php

namespace App\Actions\Auth;

// Imports: the enums, the exception it throws, the models, and the helpers below
use App\Enums\Locale;
use App\Enums\SocialProvider;
use App\Enums\SocialSignInError;
use App\Exceptions\SocialSignInRefused;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as OutsideUser;

/**
 * Works out which AtleoPlan user an outside account (Google, FEAT-9) signs
 * in, creating or linking one when needed. It does not sign anyone in:
 * GoogleSignInController does, with the user returned.
 *
 * The three cases, in this order (docs/concepts/C2-backend.md C2.7.8):
 * 1. **Already linked**: a row of `social_accounts` has this Google id. Its
 *    user, whatever their email is today; Google ids never change, emails can.
 * 2. **An email already registered** (an account with a password): Google is
 *    linked to that account, so its plans and workouts are kept. Only when
 *    Google says it has verified the address, or anyone could make a Google
 *    account with someone else's address and walk into their AtleoPlan
 *    account. (Decided with the owner on 2026-11-11, option A of FEAT-9.)
 * 3. **A new address**: a new account, with no password, the name and email
 *    from Google and the language the app was showing. Also only with a
 *    verified address, so nobody can take an address before its owner signs up.
 *
 * In every case a disabled account is refused (D1.4.15), before anything is
 * linked.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3): one job in a class of its
 * own, out of the controller, so the tests can reach every case. Created
 * with `php artisan make:class Actions/Auth/SignInWithSocialAccount`; the
 * controller receives it as a parameter, built by Laravel's service container.
 */
class SignInWithSocialAccount
{
    /**
     * Finds, links or creates the user.
     *
     * @param  SocialProvider  $provider  which service the person came back from
     * @param  OutsideUser  $outside  what that service says about them:
     *                                getId(), getEmail(), getName(), and getRaw() for the rest
     * @param  Locale  $locale  the language for a new account: the app's, on the sign-in page
     * @return User the user to sign in
     *
     * @throws SocialSignInRefused when the address is not verified, or the
     *                             account is disabled
     */
    public function handle(SocialProvider $provider, OutsideUser $outside, Locale $locale): User
    {
        // 1. Already linked? The row with this provider and id, then its user
        // through the relation. `?->` (nullsafe) stops at null when there is no
        // such row, instead of failing on null->user. (string): the id as
        // Google sent it, a string of digits
        $user = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_user_id', (string) $outside->getId())
            ->first()
            ?->user;

        if ($user !== null) {
            $this->refuseIfDisabled($user);

            return $user;
        }

        // 2 and 3 trust the address, so Google must vouch for it first
        if (! $this->isVerified($outside)) {
            throw new SocialSignInRefused(SocialSignInError::Unverified);
        }

        // Emails are kept in lowercase (Fortify's `lowercase_usernames`), so
        // Ann@x.com from Google finds the account made as ann@x.com
        $email = Str::lower((string) $outside->getEmail());

        // 2. Someone already has this address?
        $user = User::where('email', $email)->first();
        if ($user !== null) {
            $this->refuseIfDisabled($user);
        }

        // Linking and creating together: if anything fails half-way, neither
        // stays (a user with no link would be harmless, but a transaction
        // costs nothing). DB::transaction() runs the function and commits, or
        // rolls back if it throws. `use (...)` hands the function the
        // variables it needs from here; `&$user` by reference, so the new
        // user made inside is seen outside too
        DB::transaction(function () use (&$user, $provider, $outside, $email, $locale) {
            // 3. Nobody: a new account
            $user ??= $this->newUser($outside, $email, $locale);

            // Google has just shown the address belongs to this person, which
            // is what email verification would prove (C2.7.6)
            if ($user->email_verified_at === null) {
                // Not fillable (#[Fillable] on User), so set directly
                $user->email_verified_at = now();
                $user->save();
            }

            // The link, through the relation, which fills user_id
            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => (string) $outside->getId(),
            ]);
        });

        return $user;
    }

    /**
     * Whether the outside service vouches for the address. Google's answer
     * has `email_verified`, true or false, in its raw data; anything but a
     * real `true`, or no address at all, counts as not verified.
     *
     * @param  OutsideUser  $outside  what the service says about the person
     */
    private function isVerified(OutsideUser $outside): bool
    {
        // getRaw(): the whole answer of Google's userinfo, as an array
        return filled($outside->getEmail()) && ($outside->getRaw()['email_verified'] ?? false) === true;
    }

    /**
     * Stops here when an admin has disabled the account.
     *
     * @param  User  $user  the account found
     *
     * @throws SocialSignInRefused with the reason Disabled
     */
    private function refuseIfDisabled(User $user): void
    {
        if ($user->disabled_at !== null) {
            throw new SocialSignInRefused(SocialSignInError::Disabled);
        }
    }

    /**
     * Creates the account of someone new, with no password.
     *
     * @param  OutsideUser  $outside  what the service says about the person
     * @param  string  $email  their address, in lowercase
     * @param  Locale  $locale  the language the app was showing
     * @return User the new user, saved
     */
    private function newUser(OutsideUser $outside, string $email, Locale $locale): User
    {
        return User::create([
            // The name on the Google account; a Google account may have none,
            // so the part of the address before the @ stands in. Str::limit()
            // keeps it within the column's 255 characters
            'name' => Str::limit($outside->getName() ?: Str::before($email, '@'), 255, ''),
            'email' => $email,
            'locale' => $locale,
            // No 'password': the column is empty (nullable since FEAT-9)
        ]);
    }
}
