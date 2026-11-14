<?php

namespace App\Http\Controllers;

use App\Http\Resources\EquipmentResource;
use App\Models\Equipment;
use Collator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only, sorted like MuscleController.
 */
class EquipmentController extends Controller
{
    /**
     * GET /api/equipment.
     */
    public function index(): AnonymousResourceCollection
    {
        $collator = new Collator(app()->getLocale());

        $equipment = Equipment::all()
            ->sort(fn (Equipment $a, Equipment $b) => $collator->compare($a->name, $b->name))
            ->values();

        return EquipmentResource::collection($equipment);
    }
}
