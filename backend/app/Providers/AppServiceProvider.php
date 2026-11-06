<?php

namespace App\Providers;

// The namespace above places the class in App\Providers, which Composer's
// autoloader maps to the app/Providers folder (docs/concepts/C2-backend.md C2.2).

// Imports Laravel's base class, so the code below can write just
// ServiceProvider, and the facade of spatie/laravel-translatable
use Illuminate\Support\ServiceProvider;
use Spatie\Translatable\Facades\Translatable;

/**
 * The app's own service provider: the place to set things up when Laravel
 * starts, before any request is handled.
 *
 * Laravel keeps a "service container": a registry that knows how to build
 * the app's objects (the database connection, the mailer, our future
 * services) and hands them to whoever asks, for example a controller method
 * that lists a class among its parameters. Service providers fill that
 * registry and configure the framework; Laravel runs the ones listed in
 * bootstrap/providers.php, plus those of the installed packages, on every
 * request and Artisan command (docs/concepts/C2-backend.md C2.4).
 *
 * `extends ServiceProvider` means this class inherits everything from
 * Laravel's base class and only overrides these two methods.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Runs first, for every provider: only tell the container how to build
     * things here (`$this->app->bind(...)`), do not use other services yet,
     * since their providers may not have run.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Runs once every provider has registered, so all services are available:
     * the place for app-wide settings such as Eloquent's strict mode or
     * authorization rules.
     */
    public function boot(): void
    {
        // The fallback of translated columns (docs/design/D3-data-model.md
        // D3.4.5): a text missing in the current language is shown in English,
        // and if English is missing too, in any language there is
        // (fallbackAny). Without fallbackAny, a personal exercise written only
        // in Italian would have an empty name for a user who reads German.
        // Translatable is a facade, like Route or Schema (C2.2)
        Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);
    }
}
