<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Confirming the address an account signed up with. Until then the app answers
 * 403 to everything but the account itself (`verified` in routes/api.php), and
 * the React app shows only "Confirm your email".
 *
 * | Route | Does |
 * |---|---|
 * | GET /auth/verify-email/{id}/{hash} | The emailed link: confirms, then `/login?verify=done` (or `=failed`) |
 * | POST /api/user/verification-email | Sends the link again; 204 |
 *
 * Not Fortify's verification routes: its link works only in the browser that
 * signed up, as it asks for the session. A phone's mail app opens links in its
 * own browser, and an installed app on an iPhone keeps cookies of its own, so
 * the link would land on a sign-in form. Here the link is enough: it is signed,
 * expires, and went to the address it confirms.
 */
class EmailVerificationController extends Controller
{
    /**
     * A browser visit, so it answers with a redirect, never JSON. The
     * signature covers the path and its expiry, not the host: the link is
     * the React app's address, which Laravel sees behind the proxy as its own
     * (relative signature). An expired or altered link is `failed`: the
     * screen behind sign-in sends a new one.
     */
    public function verify(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = $request->hasValidRelativeSignature() && ctype_digit($id) ? User::find($id) : null;

        if ($user === null || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->toSignIn('failed');
        }

        // A second click on the same link is no error
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return $this->toSignIn('done');
    }

    /**
     * Nothing to send for an address already confirmed; the same answer, so
     * a stale screen moves on when it asks for the user again.
     */
    public function send(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->noContent();
    }

    /**
     * Signed in already in this browser, RequireGuest takes the user on into
     * the app; otherwise the sign-in form shows what happened.
     */
    private function toSignIn(string $result): RedirectResponse
    {
        return redirect()->to(config('app.frontend_url').'/login?verify='.$result);
    }
}
