<?php

/**
 * The front door of the web app: every HTTP request that is not a real file
 * (an image, a built script) reaches Laravel through this script.
 *
 * public/ is the only folder the web server exposes (FrankenPHP, running in
 * the `backend` container; see the Dockerfile), so the code, .env and storage
 * stay out of reach. The steps below are the start of the life of a request
 * (docs/concepts/C2-backend.md C2.4): load the classes, build the app, hand it the
 * request, send back its response.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// A global constant holding the start time in seconds, so Laravel and debug
// tools can measure how long the request took
define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
// `php artisan down` writes this file; while it exists it answers every
// request with the "be right back" page, before Laravel even loads. The
// assignment inside the if keeps the path in $maintenance for the require.
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
// Composer (PHP's package manager) generated this file: from then on a class
// is loaded from its file the first time it is used, by its namespace, with
// no `require` per class (docs/concepts/C2-backend.md C2.1).
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
// bootstrap/app.php returns the configured application. The `@var` comment
// only tells the editor which type $app holds.
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// Request::capture() wraps what PHP received (URL, headers, cookies, body)
// in a Request object; handleRequest() sends it through the middleware and the
// router to the route's code, then sends the response to the browser.
$app->handleRequest(Request::capture());
