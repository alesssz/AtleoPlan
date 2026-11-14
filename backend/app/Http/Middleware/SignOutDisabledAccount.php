<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Signs out, at its next request, a user an admin has just disabled. Sign-in
 * already refuses a disabled account, but a session opened before would
 * otherwise last for days.
 *
 * It does not answer by itself: the request goes on as a visitor's, so a
 * protected route answers 401, which the React app already treats as an
 * expired session (frontend/src/lib/query-client.ts). The admin panel needs
 * nothing of this: User::canAccessPanel() runs on every request.
 */
class SignOutDisabledAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user();

        if ($user !== null && $user->disabled_at !== null) {
            Auth::guard('web')->logout();
            // A token-authenticated request has no session to empty
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return $next($request);
    }
}
