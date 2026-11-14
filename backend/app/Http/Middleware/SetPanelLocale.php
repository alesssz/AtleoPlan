<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The admin panel in the admin's own language, `users.locale`; on the login
 * page, the browser's. Registered as persistent middleware in
 * AdminPanelProvider, so Livewire's requests get it too.
 */
class SetPanelLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->user()?->locale?->value
            ?? $request->getPreferredLanguage(Locale::codes());

        app()->setLocale((string) $locale);

        return $next($request);
    }
}
