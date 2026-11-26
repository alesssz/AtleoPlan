<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;

/**
 * The one answer of POST /api/auth/forgot-password, whatever happened: an
 * email sent, an address with no account, or one asked for a minute ago (the
 * broker sends one a minute). Fortify answers each its own way, which tells
 * anyone whether an address has an account. Bound to both of Fortify's
 * responses in FortifyServiceProvider.
 *
 * The time cannot tell either: the broker answers after at least 200 ms
 * either way, and the email waits in the queue (ResetPasswordEmail).
 */
class ResetLinkRequestedResponse implements FailedPasswordResetLinkRequestResponse, SuccessfulPasswordResetLinkRequestResponse
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        return new JsonResponse(['message' => __('passwords.sent')]);
    }
}
