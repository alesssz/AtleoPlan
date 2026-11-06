<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers each request in the language the app asks for, so validation errors
 * arrive in the user's language (docs/design/D2-decisions.md D2.4).
 *
 * A middleware is a step every request crosses on its way in
 * (docs/concepts/C2-backend.md C2.4). This one reads the Accept-Language header, which
 * the React app sets on every call (src/lib/http.ts). It is added to both the
 * `web` and the `api` groups in bootstrap/app.php: Fortify's routes are on the
 * first, the others on the second.
 */
class SetLocaleFromRequest
{
    /**
     * Sets the language for this request, then passes it on.
     *
     * @param  Request  $request  the incoming request
     * @param  Closure  $next  the next step: calling it continues towards the route
     * @return Response the answer, unchanged
     */
    public function handle(Request $request, Closure $next): Response
    {
        // The best match among our languages. With no header or no match it
        // gives the list's first one, English (Locale::codes())
        app()->setLocale((string) $request->getPreferredLanguage(Locale::codes()));

        return $next($request);
    }
}
