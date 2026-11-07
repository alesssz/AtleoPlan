<?php

namespace App\Http\Controllers;

// Imports: the action that builds Home's data, and the request and answer types
use App\Actions\Workouts\HomeSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/home: everything Home shows, in one request
 * (docs/design/D1-ui.md D1.4.2): the active plan and its days, the suggested
 * day, the session left open, the recent workouts. The work is in
 * HomeSummary, which describes the answer.
 *
 * Created with `make:controller HomeController`; one method, so no
 * apiResource.
 */
class HomeController extends Controller
{
    /**
     * Home's data, wrapped in `data` like every other answer of the API.
     *
     * @param  Request  $request  the request, for its user
     * @param  HomeSummary  $summary  builds the data
     * @return JsonResponse the answer
     */
    public function show(Request $request, HomeSummary $summary): JsonResponse
    {
        return response()->json(['data' => $summary->for($request->user())]);
    }
}
