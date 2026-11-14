<?php

/**
 * Routes the browser visits itself. The admin panel registers its own /admin
 * routes.
 */

use App\Http\Controllers\GoogleSignInController;
use Illuminate\Support\Facades\Route;

/*
 * Sign in with Google: browser visits that need the session for Socialite's
 * `state`. The callback's full address is registered in the Google client:
 * changing this path means changing it there too.
 */
Route::get('/auth/google/redirect', [GoogleSignInController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleSignInController::class, 'callback'])->name('google.callback');

Route::get('/', function () {
    return view('welcome');
});
