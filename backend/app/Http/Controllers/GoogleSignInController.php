<?php

namespace App\Http\Controllers;

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
 * "Continue with Google":
 *
 * 1. GET /auth/google/redirect stores what the app asked for and sends the
 *    browser to Google, with Socialite's `state` in the session.
 * 2. GET /auth/google/callback checks the state, gets the person's details,
 *    lets SignInWithSocialAccount find or create the user, starts the
 *    session and sends the browser into the app, or back to
 *    `/login?error=…`.
 *
 * Browser visits, not API calls: they live in web.php for the session the
 * state needs, and answer only with redirects.
 */
class GoogleSignInController extends Controller
{
    /** What the first stop keeps for the second. */
    private const SESSION_KEY = 'google_sign_in';

    /**
     * The link's parameters are optional and all checked, since anyone can
     * type a link:
     * - `from`: the page the person was opening, a path of this app only;
     * - `locale`: the app's language, for a new account;
     * - `to=admin`: the visit started on the admin panel's login page and goes
     *   back there. Only that word is read, never an address, which would be an
     *   open redirect.
     *
     * Socialite's redirect is Symfony's class, hence the wider return type.
     */
    public function redirect(Request $request): AnyRedirect
    {
        // Without credentials Google would show an error page of its own
        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret'))) {
            Log::warning('Sign in with Google is not set up: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing from backend/.env (docs/start/S1-setup.md S1.11).');

            return $this->backToSignIn(SocialSignInError::Failed, $request->query('to') === 'admin');
        }

        $request->session()->put(self::SESSION_KEY, [
            'from' => $this->safePath($request->query('from')),
            'locale' => Locale::tryFrom((string) $request->query('locale'))?->value,
            'admin' => $request->query('to') === 'admin',
        ]);

        return Socialite::driver(SocialProvider::Google->value)->redirect();
    }

    public function callback(Request $request, SignInWithSocialAccount $signIn): RedirectResponse
    {
        // Pulled, so it is used once; [] when the visit did not start here
        $intent = $request->session()->pull(self::SESSION_KEY, []);
        $toAdmin = (bool) ($intent['admin'] ?? false);

        // access_denied: the person pressed Cancel. Any other error is not
        // theirs to fix
        if ($request->filled('error')) {
            return $this->backToSignIn(
                $request->query('error') === 'access_denied' ? SocialSignInError::Cancelled : SocialSignInError::Failed,
                $toAdmin,
            );
        }

        try {
            // Throws on a state mismatch (expired, opened twice, started
            // elsewhere) or when Google refuses the code
            $outside = Socialite::driver(SocialProvider::Google->value)->user();
        } catch (Exception $e) {
            // The details belong in the log, not on the screen
            report($e);

            return $this->backToSignIn(SocialSignInError::Failed, $toAdmin);
        }

        try {
            // A new account's language: the app's, else the browser's, else English
            $locale = Locale::tryFrom((string) ($intent['locale'] ?? ''))
                ?? Locale::tryFrom(app()->getLocale())
                ?? Locale::En;
            $user = $signIn->handle(SocialProvider::Google, $outside, $locale);
        } catch (SocialSignInRefused $e) {
            return $this->backToSignIn($e->reason, $toAdmin);
        }

        // Remembered, as the app always asks: a phone at the gym stays signed
        // in
        Auth::login($user, remember: true);
        // Against session fixation
        $request->session()->regenerate();

        // A non-admin who started on the panel is signed in all the same, and
        // lands in the app rather than on the panel's 403
        if ($toAdmin && $user->canAccessPanel(Filament::getPanel('admin'))) {
            return redirect()->to(config('app.admin_url'));
        }

        return redirect()->to(config('app.frontend_url').($intent['from'] ?? '/'));
    }

    /**
     * Back to the sign-in page the visit started from, which shows the
     * reason: the app's, or the admin panel's
     * (resources/views/filament/google-sign-in.blade.php).
     */
    private function backToSignIn(SocialSignInError $reason, bool $toAdmin = false): RedirectResponse
    {
        return redirect()->to($toAdmin
            ? config('app.admin_url').'/login?google_error='.$reason->value
            : config('app.frontend_url').'/login?error='.$reason->value);
    }

    /**
     * `from` if it is a path of this app, such as `/plans`; null otherwise,
     * against open redirects. A path starts with exactly one `/` (`//host` is
     * another site to a browser) and holds no backslash, which some browsers
     * read as `/`, and no control character.
     */
    private function safePath(mixed $from): ?string
    {
        return is_string($from) && strlen($from) <= 2000 && preg_match('#^/(?!/)[^\\\\\x00-\x1F]*\z#', $from) === 1
            ? $from
            : null;
    }
}
