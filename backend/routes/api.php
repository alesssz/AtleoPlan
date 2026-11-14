<?php

/**
 * The JSON API of the React app, under /api, authenticated with Sanctum's
 * session cookie. Sign-in, sign-up, sign-out and password reset are Fortify's,
 * under /api/auth (config/fortify.php).
 */

use App\Http\Controllers\CurrentUserController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\ExercisePhotoController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MuscleController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\WorkoutSessionController;
use Illuminate\Support\Facades\Route;

// Public: proves the whole chain answers (browser → Vite or Caddy → Laravel);
// shown on Profile (frontend/src/api/health.ts)
Route::get('/health', fn () => response()->json(['status' => 'ok']))->name('health');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [CurrentUserController::class, 'show']);
    Route::patch('/user/preferences', [CurrentUserController::class, 'updatePreferences']);

    // The exercise library
    Route::get('/muscles', [MuscleController::class, 'index']);
    Route::get('/equipment', [EquipmentController::class, 'index']);
    Route::apiResource('exercises', ExerciseController::class);
    Route::post('/exercises/{exercise}/duplicate', [ExerciseController::class, 'duplicate']);
    Route::post('/exercises/{exercise}/photos', [ExercisePhotoController::class, 'store']);
    Route::put('/exercises/{exercise}/photos', [ExercisePhotoController::class, 'reorder']);
    Route::delete('/exercises/{exercise}/photos/{photo}', [ExercisePhotoController::class, 'destroy'])->whereNumber('photo');

    // The workout plans
    Route::apiResource('plans', PlanController::class);
    Route::post('/plans/{plan}/activate', [PlanController::class, 'activate']);
    Route::post('/plans/{plan}/archive', [PlanController::class, 'archive']);
    Route::post('/plans/{plan}/unarchive', [PlanController::class, 'unarchive']);
    Route::get('/plans/{plan}/export', [PlanController::class, 'export']);
    Route::post('/plans/import', [PlanController::class, 'import']);

    // The workouts. No POST: saving is a PUT to the session's own UUID, made on
    // the phone. whereUuid() also keeps 'last-sets' from being read as a
    // session's id
    Route::get('/sessions', [WorkoutSessionController::class, 'index']);
    Route::get('/sessions/last-sets', [WorkoutSessionController::class, 'lastSets']);
    Route::get('/sessions/{session}', [WorkoutSessionController::class, 'show'])->whereUuid('session');
    Route::put('/sessions/{session}', [WorkoutSessionController::class, 'save'])->whereUuid('session');
    Route::delete('/sessions/{session}', [WorkoutSessionController::class, 'destroy'])->whereUuid('session');

    Route::get('/home', [HomeController::class, 'show']);
});
