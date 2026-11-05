<?php

/**
 * Messages of signing in (docs/05-backend.md 5.7.7). Read with __('auth.failed');
 * the language is set for each request by app/Http/Middleware/SetLocaleFromRequest.php.
 */
return [
    'failed' => 'Diese Anmeldedaten stimmen nicht mit unseren Daten überein.',
    'password' => 'Das Passwort ist nicht korrekt.',
    'throttle' => 'Zu viele Anmeldeversuche. Bitte versuche es in :seconds Sekunden erneut.',
    'disabled' => 'Dieses Konto wurde deaktiviert.',
];
