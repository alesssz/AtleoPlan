<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers in the language the app sends in Accept-Language (src/lib/http.ts),
 * so validation errors arrive translated. English when the header matches none
 * of ours.
 */
class SetLocaleFromRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale((string) $request->getPreferredLanguage(Locale::codes()));

        return $next($request);
    }
}
