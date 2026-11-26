<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Laravel's reset email, sent by the queue rather than during the request:
 * waiting for the mail server would make a known address answer later than
 * an unknown one (ResetLinkRequestedResponse). Its look and texts are set in
 * FortifyServiceProvider, as for Laravel's own.
 */
class ResetPasswordEmail extends ResetPassword implements ShouldQueue
{
    use Queueable;
}
