<?php

/**
 * Messages of signing in (docs/concepts/C2-backend.md C2.7.7). Read with __('auth.failed');
 * the language is set for each request by app/Http/Middleware/SetLocaleFromRequest.php.
 */
return [
    'failed' => 'Estas credenciales no coinciden con nuestros datos.',
    'password' => 'La contraseña no es correcta.',
    'throttle' => 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en :seconds segundos.',
    'disabled' => 'Esta cuenta ha sido desactivada.',
];
