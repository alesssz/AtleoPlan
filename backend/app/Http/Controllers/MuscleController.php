<?php

namespace App\Http\Controllers;

// Imports: the resource, the model, the answer type, and PHP's Collator
// (from the intl extension) for sorting by name
use App\Http\Resources\MuscleResource;
use App\Models\Muscle;
use Collator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The muscle groups, for the library's filter and the exercise editor
 * (docs/design/D1-ui.md D1.4.3, D1.4.5). Read-only: the 17 rows come from
 * MuscleSeeder.
 *
 * No policy: every signed-in user may read the whole list, and the route is
 * already under `auth:sanctum`.
 */
class MuscleController extends Controller
{
    /**
     * GET /api/muscles: every muscle, sorted by its name in the request's
     * language.
     *
     * The sorting is done in PHP, not in SQL: there are 17 rows, and the
     * names are read through HasTranslations. Collator sorts by the rules of
     * a language, so accents and capitals fall where a reader expects them.
     *
     * @return AnonymousResourceCollection the muscles, in `data`
     */
    public function index(): AnonymousResourceCollection
    {
        // The comparison rules of the request's language
        $collator = new Collator(app()->getLocale());

        // sort() with a function: it receives two muscles and returns a
        // negative number, zero or a positive one, as compare() does;
        // values() renumbers the keys so the JSON is a list
        $muscles = Muscle::all()
            ->sort(fn (Muscle $a, Muscle $b) => $collator->compare($a->name, $b->name))
            ->values();

        return MuscleResource::collection($muscles);
    }
}
