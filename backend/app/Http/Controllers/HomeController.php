<?php

namespace App\Http\Controllers;

use App\Actions\Workouts\HomeSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/home: everything Home shows in one request. HomeSummary describes
 * the answer.
 */
class HomeController extends Controller
{
    public function show(Request $request, HomeSummary $summary): JsonResponse
    {
        return response()->json(['data' => $summary->for($request->user())]);
    }
}
