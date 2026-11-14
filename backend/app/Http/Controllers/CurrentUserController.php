<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePreferencesRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The signed-in user's own account. It only touches the user asking, so no
 * policy is involved.
 */
class CurrentUserController extends Controller
{
    /**
     * GET /api/user: asked at start-up; the answer decides which screens may
     * open (src/routes/RequireAuth.tsx).
     */
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * PATCH /api/user/preferences.
     *
     * 204 rather than the updated user: with two changes close together, the
     * first answer could carry the old value of the second, and the app would
     * show it.
     */
    public function updatePreferences(UpdatePreferencesRequest $request): Response
    {
        $request->user()->update($request->validated());

        return response()->noContent();
    }
}
