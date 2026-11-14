<?php

namespace App\Actions\Auth;

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
 * Works out which AtleoPlan user an outside account (Google) signs in, creating
 * or linking one when needed. It does not sign anyone in:
 * GoogleSignInController does, with the user returned.
 *
 * The three cases, in this order:
 * 1. **Already linked**: a row of `social_accounts` has this Google id. Its
 *    user, whatever their email is today; Google ids never change, emails can.
 * 2. **An email already registered** (an account with a password): Google is
 *    linked to that account, so its plans and workouts are kept. Only when
 *    Google says it has verified the address, or anyone could make a Google
 *    account with someone else's address and walk into their AtleoPlan account
 *    (option A).
 * 3. **A new address**: a new account, with no password, the name and email
 *    from Google and the language the app was showing. Also only with a
 *    verified address, so nobody can take an address before its owner signs up.
 *
 * In every case a disabled account is refused, before anything is linked.
 */
class SignInWithSocialAccount
{
    /**
     * @param  Locale  $locale  a new account's language
     *
     * @throws SocialSignInRefused when the address is not verified, or the
     *                             account is disabled
     */
    public function handle(SocialProvider $provider, OutsideUser $outside, Locale $locale): User
    {
        // 1. Already linked
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

        // Stored lowercased (Fortify's `lowercase_usernames`)
        $email = Str::lower((string) $outside->getEmail());

        // 2. An account with this address
        $user = User::where('email', $email)->first();
        if ($user !== null) {
            $this->refuseIfDisabled($user);
        }

        DB::transaction(function () use (&$user, $provider, $outside, $email, $locale) {
            // 3. A new account
            $user ??= $this->newUser($outside, $email, $locale);

            // Google has just proved what email verification would
            if ($user->email_verified_at === null) {
                $user->email_verified_at = now();
                $user->save();
            }

            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => (string) $outside->getId(),
            ]);
        });

        return $user;
    }

    /**
     * Anything but a real `true` in Google's `email_verified`, or no address
     * at all, counts as not verified.
     */
    private function isVerified(OutsideUser $outside): bool
    {
        return filled($outside->getEmail()) && ($outside->getRaw()['email_verified'] ?? false) === true;
    }

    /**
     * @throws SocialSignInRefused
     */
    private function refuseIfDisabled(User $user): void
    {
        if ($user->disabled_at !== null) {
            throw new SocialSignInRefused(SocialSignInError::Disabled);
        }
    }

    /**
     * With no password, until one is set through Forgot password.
     */
    private function newUser(OutsideUser $outside, string $email, Locale $locale): User
    {
        return User::create([
            // A Google account may have no name
            'name' => Str::limit($outside->getName() ?: Str::before($email, '@'), 255, ''),
            'email' => $email,
            'locale' => $locale,
        ]);
    }
}
