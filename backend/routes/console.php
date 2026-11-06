<?php

/**
 * The app's own Artisan commands written as closures, and later its scheduled
 * tasks (docs/concepts/C2-backend.md C2.13).
 *
 * bootstrap/app.php loads this file (`commands:`) whenever Artisan runs.
 * Bigger commands get their own class (`php artisan make:command`) instead,
 * in app/Console/Commands, which Laravel registers by itself: the first one
 * is ImportFreeExerciseDb, `exercises:import` (docs/concepts/C2-backend.md C2.14).
 */

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Laravel's example command: `make artisan c="inspire"` prints a quote.
// Artisan is a facade (a static-looking call Laravel passes to the console
// kernel). Inside the function `$this` is the running command, so
// $this->comment() prints a line; purpose() is the description shown by
// `php artisan list`.
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
