<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Spatie\Translatable\Facades\Translatable;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // A text missing in the current language falls back to English, then to
        // any language there is: a personal exercise written only in Italian
        // must not have an empty name for a German reader
        Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);
    }
}
