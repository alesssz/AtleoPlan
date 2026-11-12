<?php

namespace App\Http\Middleware;

// Imports: the enum of our languages, the type of the next step, the request,
// and the type of the answer
use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Shows the admin panel in the signed-in admin's language, `users.locale`:
 * the language they chose in the app (docs/concepts/C2-backend.md C2.8.1).
 * Before signing in, on the panel's login page, the browser's language,
 * as SetLocaleFromRequest does for the React app.
 *
 * A middleware is a step every request crosses on its way in
 * (docs/concepts/C2-backend.md C2.4). Generated with
 * `make:middleware SetPanelLocale`. It is listed in the panel's own
 * middleware (app/Providers/Filament/AdminPanelProvider.php) as
 * **persistent**: the panel's pages talk to the server through Livewire
 * requests (a filter changed, a form saved), which pass only through
 * persistent middleware, and would otherwise be answered in another language.
 *
 * With the language set, Filament's own texts come from its translations,
 * and ours from lang/<language>/admin.php.
 */
class SetPanelLocale
{
    /**
     * Sets the language for this request, then passes it on.
     *
     * @param  Request  $request  the incoming request
     * @param  Closure  $next  the next step: calling it continues towards the page
     * @return Response the answer, unchanged
     */
    public function handle(Request $request, Closure $next): Response
    {
        // The signed-in user, or null on the login page. `?->`: null when
        // there is no user, instead of an error
        $locale = $request->user()?->locale?->value
            // `??`: when there is none, the best of the browser's languages
            ?? $request->getPreferredLanguage(Locale::codes());

        app()->setLocale((string) $locale);

        return $next($request);
    }
}
