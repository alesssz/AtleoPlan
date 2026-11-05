<?php

namespace App\Providers\Filament;

// The namespace above maps to the app/Providers/Filament folder (docs/05-backend.md 5.2).

// Imports: the Filament and Laravel classes used below, each by its short name
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

/**
 * Sets up the Filament admin panel at /admin: the back office where admins
 * manage the users and the public exercise library (docs/02-decisions.md 2.2,
 * its resource comes with BE-1; docs/05-backend.md 5.8).
 *
 * Filament builds the panel's pages (login, dashboard, lists, forms) from PHP
 * classes, with no frontend code to write. A panel is declared by a service
 * provider like this one (a PanelProvider is a ServiceProvider, see
 * app/Providers/AppServiceProvider.php), created by
 * `php artisan filament:install --panels` and listed in bootstrap/providers.php.
 *
 * Who may enter: only admins. Any user can try the panel's own login page, but
 * User::canAccessPanel() (app/Models/User.php) checks the admin flag, and
 * Filament refuses everyone else, in every environment.
 */
class AdminPanelProvider extends PanelProvider
{
    /**
     * Describes the panel to Filament.
     *
     * Each `->` call sets one option and returns the same Panel object, so the
     * calls can be chained one after the other ("fluent" style).
     *
     * @param  Panel  $panel  An empty panel, handed in by Filament
     * @return Panel The same panel, configured
     */
    public function panel(Panel $panel): Panel
    {
        return $panel
            // The panel used when none is named; the app has only this one
            ->default()
            // Internal name, and the URL prefix: http://localhost:8500/admin
            ->id('admin')
            ->path('admin')
            // Adds the panel's own login page at /admin/login (session cookie)
            ->login()
            // Main colour of buttons and links; Color::Amber is a constant of
            // the Color class (`::` reads something that belongs to the class
            // itself rather than to an object)
            ->colors([
                'primary' => Color::Amber,
            ])
            // Loads every Resource (one per model: list, create, edit pages),
            // custom Page and Widget found in these app/Filament folders, so a
            // class generated with `php artisan make:filament-resource` shows
            // up without being listed here. `in:` and `for:` are named
            // arguments: the parameter's name written before its value.
            // app_path() is a Laravel helper giving the full path of app/.
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            // Pages and widgets added by hand. `Dashboard::class` is the
            // class's full name as a string ('Filament\Pages\Dashboard'):
            // Filament creates the object itself when it needs one.
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            // The dashboard's cards: the signed-in admin, and Filament's version
            ->widgets([
                AccountWidget::class,
                FilamentInfoWidget::class,
            ])
            // Middleware: steps every request to the panel passes through
            // before reaching the page, in this order (docs/05-backend.md 5.4).
            // The Laravel ones are the usual "web" stack: encrypted cookies,
            // the session, error messages for forms, protection against forged
            // form posts (CSRF), and turning an {id} in the URL into the model
            // it names. The Filament ones prepare the panel.
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            // Runs on every page except login: a visitor who is not signed in
            // is sent to /admin/login
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
