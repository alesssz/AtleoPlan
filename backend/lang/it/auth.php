<?php

/**
 * Messages of signing in (docs/concepts/C2-backend.md C2.7.7). Read with __('auth.failed');
 * the language is set for each request by app/Http/Middleware/SetLocaleFromRequest.php.
 */
return [
    'failed' => 'Queste credenziali non corrispondono ai nostri dati.',
    'password' => 'La password non è corretta.',
    'throttle' => 'Troppi tentativi di accesso. Riprova tra :seconds secondi.',
    'disabled' => 'Questo account è stato disattivato.',
];
