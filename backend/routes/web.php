<?php

/**
 * Routes the browser visits itself. The admin panel registers its own /admin
 * routes. Nothing answers at `/`: the interface is the React app.
 */

use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\GoogleSignInController;
use Illuminate\Support\Facades\Route;

/*
 * Sign in with Google: browser visits that need the session for Socialite's
 * `state`. The callback's full address is registered in the Google client:
 * changing this path means changing it there too.
 */
Route::get('/auth/google/redirect', [GoogleSignInController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleSignInController::class, 'callback'])->name('google.callback');

// The link of the "Confirm your email" email, opened in whatever browser the
// mail app picks: no session needed, the signature is checked inside. The
// sign-in routes' limit per address
Route::get('/auth/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('throttle:fortify')
    ->name('verification.verify');
