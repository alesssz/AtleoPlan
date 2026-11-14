<?php

namespace App\Http\Controllers;

use App\Http\Resources\MuscleResource;
use App\Models\Muscle;
use Collator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only, for the library's filter and the exercise editor. Every signed-in
 * user may read it.
 */
class MuscleController extends Controller
{
    /**
     * GET /api/muscles, sorted by name in the request's language. In PHP
     * rather than SQL: a handful of rows, with translated names, and Collator
     * puts accents and capitals where a reader of that language expects.
     */
    public function index(): AnonymousResourceCollection
    {
        $collator = new Collator(app()->getLocale());

        $muscles = Muscle::all()
            ->sort(fn (Muscle $a, Muscle $b) => $collator->compare($a->name, $b->name))
            ->values();

        return MuscleResource::collection($muscles);
    }
}
