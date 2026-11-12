<?php

namespace App\Http\Middleware;

// Imports: the type of the next step, the Auth facade, the request, and the
// type of the answer
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Signs out, at its next request, a user whose account an admin has just
 * disabled (BE-2, docs/concepts/C2-backend.md C2.7.9).
 *
 * Signing in already refuses a disabled account, with a password
 * (FortifyServiceProvider) and with Google (SignInWithSocialAccount). But
 * someone signed in before being disabled keeps a valid session cookie, and
 * without this step would stay signed in until it ends, days later.
 *
 * A middleware (docs/concepts/C2-backend.md C2.4), generated with
 * `make:middleware SignOutDisabledAccount` and added to the `web` and `api`
 * groups in bootstrap/app.php, so it sees every request of the React app.
 * It does not answer by itself: it ends the session and lets the request
 * go on as a visitor's. A route that needs a user (`auth:sanctum`) then
 * answers 401, which the React app already reads as "the session has ended"
 * and opens the sign-in page (frontend/src/lib/query-client.ts); signing in
 * again is refused with "This account has been disabled.". Public routes
 * work as for any visitor.
 *
 * The admin panel needs nothing of this: User::canAccessPanel() refuses a
 * disabled admin at every request.
 */
class SignOutDisabledAccount
{
    /**
     * Ends the session of a disabled user, then passes the request on.
     *
     * @param  Request  $request  the incoming request
     * @param  Closure  $next  the next step: calling it continues towards the route
     * @return Response the answer of the rest of the app
     */
    public function handle(Request $request, Closure $next): Response
    {
        // The user of the session cookie, or null for a visitor. The `web`
        // guard is the one Sanctum uses for the React app (docs/concepts/C2-backend.md C2.7)
        $user = Auth::guard('web')->user();

        if ($user !== null && $user->disabled_at !== null) {
            // logout() forgets the user in the session; invalidate() empties
            // the session and gives it a new id; regenerateToken() makes a new
            // CSRF token. The same three steps as signing out (C2.7.2)
            Auth::guard('web')->logout();
            // hasSession(): a request with no session (a call with an API
            // token, one day) has nothing to empty
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return $next($request);
    }
}
