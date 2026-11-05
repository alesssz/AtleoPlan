<?php

namespace App\Http\Controllers;

// The namespace line above is the "folder" this class lives in, so two classes
// with the same name never clash. Composer's autoloader maps the App\ prefix
// to the app/ folder, so App\Http\Controllers\Controller is found in this
// very file (docs/05-backend.md 5.2, 5.3).

/**
 * The base class every controller of the app extends.
 *
 * A controller is the class a route hands the request to: it reads the
 * request, asks the models or services for the data and returns the response
 * (docs/05-backend.md 5.5). New controllers, created with
 * `php artisan make:controller`, start with `extends Controller`, so anything
 * every controller should share (a helper method, a trait) goes here.
 *
 * It is `abstract`: it cannot be used on its own (`new Controller` is an
 * error), only extended. It is empty for now: routes/api.php still answers
 * with small inline functions instead of controllers.
 */
abstract class Controller
{
    //
}
