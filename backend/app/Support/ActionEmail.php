<?php

namespace App\Support;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * An email that asks for one thing, through one button: confirming the
 * address, choosing a new password. Drawn by resources/views/emails/action
 * (HTML) and action-text (plain text), in the app's colours, instead of
 * Laravel's default layout.
 *
 * The texts arrive translated: notifications render in the account's
 * language (User::preferredLocale()).
 */
final class ActionEmail
{
    /**
     * @param  string  $email  the account's address, which the intro names and the HTML highlights
     * @param  string  $preview  the line an inbox shows beside the subject
     */
    public static function make(
        string $subject,
        string $preview,
        string $eyebrow,
        string $title,
        string $intro,
        string $email,
        string $button,
        string $url,
        string $note,
    ): MailMessage {
        return (new MailMessage)
            ->subject($subject)
            ->view(['emails.action', 'emails.action-text'], [
                'preview' => $preview,
                'eyebrow' => $eyebrow,
                'title' => $title,
                'intro' => $intro,
                'email' => $email,
                'button' => $button,
                'url' => $url,
                'note' => $note,
                // The logo is the React app's file, on the address the links use
                'appUrl' => config('app.frontend_url'),
            ]);
    }
}
