<?php

/**
 * The app's own service providers, which Laravel runs at startup, in this
 * order (docs/05-backend.md 5.4).
 *
 * A service provider sets up part of the app: it fills the service container
 * and configures the framework (see app/Providers/AppServiceProvider.php).
 * Installed packages (Sanctum, Filament, medialibrary) bring their own
 * providers, which Laravel finds by itself in their composer.json ("package
 * discovery"), so only the classes in app/Providers are listed here. Artisan
 * adds to this list when it generates a provider, e.g. `make:filament-panel`.
 *
 * Like bootstrap/app.php it is a script that returns a value, here an array.
 */

use App\Providers\AppServiceProvider;
use App\Providers\Filament\AdminPanelProvider;

// `X::class` is the class's full name as a string, e.g.
// 'App\Providers\AppServiceProvider': Laravel creates the objects itself.
return [
    // App-wide setup (empty for now)
    AppServiceProvider::class,
    // The Filament admin panel at /admin (docs/05-backend.md 5.8)
    AdminPanelProvider::class,
];
