<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePreferencesRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The signed-in user's own account: reading it and changing its preferences.
 *
 * Its routes are in routes/api.php, under `auth:sanctum`, so `$request->user()`
 * is never null here. It only ever touches the user asking, which is why no
 * policy is needed. A thin controller: docs/05-backend.md 5.5.
 */
class CurrentUserController extends Controller
{
    /**
     * GET /api/user: who is signed in. The React app asks at start-up, and the
     * answer decides which screens may open (src/routes/RequireAuth.tsx).
     *
     * @param  Request  $request  the current request, passed in by Laravel
     * @return UserResource the user, as JSON
     */
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * PATCH /api/user/preferences: saves the language or the theme on the
     * account (docs/01-ui-design.md 1.4.14).
     *
     * Having the Form Request as a parameter is what makes Laravel validate
     * first. validated() holds only the fields that passed its rules, so nothing
     * else can be changed through this endpoint.
     *
     * It answers 204 with no body, rather than the updated user: with two changes
     * close together, that user could hold the old value of the other one, and
     * the React app would show it (docs/04-frontend.md 4.13).
     *
     * @param  UpdatePreferencesRequest  $request  the validated request
     * @return Response an empty answer
     */
    public function updatePreferences(UpdatePreferencesRequest $request): Response
    {
        $request->user()->update($request->validated());

        return response()->noContent();
    }
}
