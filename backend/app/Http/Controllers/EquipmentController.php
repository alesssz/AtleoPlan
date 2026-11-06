<?php

namespace App\Http\Controllers;

// Imports: the resource, the model, the answer type, and PHP's Collator
use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use Collator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The kinds of equipment, for the library's filter and the exercise editor.
 * The same as MuscleController, which explains it; the 12 rows come from
 * EquipmentSeeder.
 */
class EquipmentController extends Controller
{
    /**
     * GET /api/equipment: every kind of equipment, sorted by its name in the
     * request's language.
     *
     * @return AnonymousResourceCollection the equipment, in `data`
     */
    public function index(): AnonymousResourceCollection
    {
        // The comparison rules of the request's language
        $collator = new Collator(app()->getLocale());

        // Sorted by name, keys renumbered
        $equipment = Equipment::all()
            ->sort(fn (Equipment $a, Equipment $b) => $collator->compare($a->name, $b->name))
            ->values();

        return EquipmentResource::collection($equipment);
    }
}
