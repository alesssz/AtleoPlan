<?php

namespace App\Http\Controllers;

// Imports: the action that finds the user, the enums, the exception it throws,
// and Filament's, Laravel's and Socialite's pieces used below
use App\Actions\Auth\SignInWithSocialAccount;
use App\Enums\Locale;
use App\Enums\SocialProvider;
use App\Enums\SocialSignInError;
use App\Exceptions\SocialSignInRefused;
use Exception;
use Filament\Facades\Filament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as AnyRedirect;

/**
 * "Continue with Google" (FEAT-9): the two stops of the browser on its way to
 * Google and back, routes in routes/web.php. docs/concepts/C2-backend.md C2.7.8
 * draws the whole journey.
 *
 * 1. **GET /auth/google/redirect**: the button on the sign-in page is a plain
 *    link here. Laravel Socialite writes a random `state` in the session and
 *    sends the browser to Google's account chooser with it.
 * 2. **GET /auth/google/callback**: Google sends the browser back here with a
 *    one-time `code` and the same `state`. Socialite checks the state (so the
 *    visit started here, not on another site), swaps the code for the
 *    person's details, and SignInWithSocialAccount finds or creates the user.
 *    Then the session starts, as with a password, and the browser goes to the
 *    React app; or back to `/login?error=…` when something went wrong.
 *
 * Both are browser visits, not fetch() calls from React: the browser itself
 * has to go to Google and come back. That is why the routes are in web.php,
 * whose `web` middleware gives them the session (and Socialite needs it for
 * the state), and why they answer with redirects, never JSON.
 *
 * Laravel Socialite is Laravel's official package for signing in with
 * outside accounts (OAuth): it knows the addresses and the answers of
 * Google, GitHub, Facebook… (`composer require laravel/socialite`,
 * docs/how-to/H2-backend.md H2.15). Its settings: `services.google` in
 * config/services.php.
 */
class GoogleSignInController extends Controller
{
    /**
     * Where the session keeps, between the two stops, what the React app
     * asked for: the page to land on and the language of a new account.
     */
    private const SESSION_KEY = 'google_sign_in';

    /**
     * The first stop: off to Google.
     *
     * The link may carry three things, all optional and all checked, since
     * anyone can type a link:
     * - `from`: the page the person was trying to open (D1.4.1, "Coming
     *   back"), only a path of this app such as `/plans`;
     * - `locale`: the language the app is showing, for a new account;
     * - `to=admin`: the visit started on the admin panel's login page, and
     *   goes back there (docs/concepts/C2-backend.md C2.8.4). Only that one
     *   word is read: never an address, which would be an open redirect.
     *
     * @param  Request  $request  the browser's visit
     * @return AnyRedirect to Google, or back to the sign-in page when Google
     *                     is not set up on this computer. Socialite's own
     *                     redirect is Symfony's class, which Laravel's extends,
     *                     hence the wider type
     */
    public function redirect(Request $request): AnyRedirect
    {
        // No credentials in backend/.env: Google would answer with an error
        // page of its own. Better to stay in the app and say so in the log
        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret'))) {
            Log::warning('Sign in with Google is not set up: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing from backend/.env (docs/start/S1-setup.md S1.11).');

            return $this->backToSignIn(SocialSignInError::Failed, $request->query('to') === 'admin');
        }

        // Kept for the second stop. session()->put() writes in this visitor's
        // session, the row of `sessions` named by their cookie (C2.7.1).
        // Locale::tryFrom() gives the enum case, or null for anything that is
        // not one of our languages; ?->value then gives the string, or null
        $request->session()->put(self::SESSION_KEY, [
            'from' => $this->safePath($request->query('from')),
            'locale' => Locale::tryFrom((string) $request->query('locale'))?->value,
            // true only for the exact word "admin"
            'admin' => $request->query('to') === 'admin',
        ]);

        // Socialite::driver('google') is the Google provider, set up from
        // config/services.php. redirect() writes the `state` in the session
        // and answers 302 to accounts.google.com, with our client id, the
        // callback address and the scopes openid, profile and email
        return Socialite::driver(SocialProvider::Google->value)->redirect();
    }

    /**
     * The second stop: back from Google.
     *
     * @param  Request  $request  the browser's visit, with Google's `code`
     *                            and `state`, or an `error`
     * @param  SignInWithSocialAccount  $signIn  finds, links or creates the
     *                                           user; given by the service container
     * @return RedirectResponse into the React app, or back to the sign-in page
     */
    public function callback(Request $request, SignInWithSocialAccount $signIn): RedirectResponse
    {
        // What the first stop kept, taken out of the session (pull: read and
        // forget, so it is used once). [] when the visit did not start there
        $intent = $request->session()->pull(self::SESSION_KEY, []);
        // Whether the visit started on the admin panel's login page
        $toAdmin = (bool) ($intent['admin'] ?? false);

        // Google adds ?error=access_denied when the person pressed Cancel
        // (or did not give consent). Any other error is not theirs to fix
        if ($request->filled('error')) {
            return $this->backToSignIn(
                $request->query('error') === 'access_denied' ? SocialSignInError::Cancelled : SocialSignInError::Failed,
                $toAdmin,
            );
        }

        try {
            // Checks the state, sends the code to Google with our secret,
            // and asks Google who the person is. Throws when the state does
            // not match (InvalidStateException: the visit expired, was
            // opened twice, or started elsewhere) or when Google refuses
            // (a wrong secret, a code already used)
            $outside = Socialite::driver(SocialProvider::Google->value)->user();
        } catch (Exception $e) {
            // report(): writes the exception to the log
            // (storage/logs/laravel.log, `make logs`), where the details are
            // useful; the person only sees "something went wrong"
            report($e);

            return $this->backToSignIn(SocialSignInError::Failed, $toAdmin);
        }

        try {
            // The language for a new account: the app's, or this request's
            // when the link did not say (SetLocaleFromRequest set it from the
            // browser's Accept-Language), or English
            $locale = Locale::tryFrom((string) ($intent['locale'] ?? ''))
                ?? Locale::tryFrom(app()->getLocale())
                ?? Locale::En;
            // The user to sign in: found, linked or created (C2.7.8)
            $user = $signIn->handle(SocialProvider::Google, $outside, $locale);
        } catch (SocialSignInRefused $e) {
            return $this->backToSignIn($e->reason, $toAdmin);
        }

        // Signs the user in, as Fortify does after a password: the session
        // now holds their id. `remember: true`, as the React app always asks
        // (D1.4.1: a phone at the gym stays signed in)
        Auth::login($user, remember: true);
        // A new session id, so one planted before signing in becomes useless
        // ("session fixation", C2.7.2)
        $request->session()->regenerate();

        // Into the admin panel, when the visit started there and the user is
        // an admin. canAccessPanel() wants the panel; Filament::getPanel()
        // gives it ('admin', the only one). Someone who is not an admin has
        // signed in all the same, and lands in the React app instead of on
        // the panel's 403
        if ($toAdmin && $user->canAccessPanel(Filament::getPanel('admin'))) {
            return redirect()->to(config('app.admin_url'));
        }

        // Into the React app: the page first asked for, or Home. Its
        // RequireAuth then finds the session through GET /api/user
        return redirect()->to(config('app.frontend_url').($intent['from'] ?? '/'));
    }

    /**
     * Back to the sign-in page the visit started from, which shows the
     * reason: the React app's (`auth.google.errors.<reason>`), or the admin
     * panel's (`admin.google.errors.<reason>`, read by
     * resources/views/filament/google-sign-in.blade.php).
     *
     * @param  SocialSignInError  $reason  why
     * @param  bool  $toAdmin  the visit started on the admin panel's login page
     */
    private function backToSignIn(SocialSignInError $reason, bool $toAdmin = false): RedirectResponse
    {
        return redirect()->to($toAdmin
            ? config('app.admin_url').'/login?google_error='.$reason->value
            : config('app.frontend_url').'/login?error='.$reason->value);
    }

    /**
     * The `from` of the link if it is a path of this app, such as `/plans`;
     * null otherwise.
     *
     * Anyone can make a link with `from=https://evil.example`, and a sign-in
     * that ends on another site is a classic trick ("open redirect"): the
     * person trusts the page because they have just signed in. Only a path is
     * kept: it starts with one `/` (two, `//evil.example`, means another site
     * to a browser), and has no backslash, which some browsers read as a `/`.
     *
     * @param  mixed  $from  the query parameter, whatever was sent
     */
    private function safePath(mixed $from): ?string
    {
        // is_string(): `from[]=x` would give an array. preg_match() answers 1
        // when the pattern matches: `^/` a slash first, `(?!/)` not followed
        // by another, then to the end (`\z`) no backslash and no control
        // character such as a line break (`[^\\\x00-\x1F]`, written with
        // doubled backslashes inside PHP's quotes)
        return is_string($from) && strlen($from) <= 2000 && preg_match('#^/(?!/)[^\\\\\x00-\x1F]*\z#', $from) === 1
            ? $from
            : null;
    }
}
