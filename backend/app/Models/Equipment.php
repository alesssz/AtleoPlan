<?php

namespace App\Models;

// Imports: the Fillable attribute, the trait for factories, Eloquent's base
// Model, the type of the relation below, and spatie's trait for translations
use Database\Factories\EquipmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

/**
 * A kind of equipment, such as barbell or cable: one row of `equipment`
 * (docs/design/D3-data-model.md D3.4.1). The 12 rows come from
 * EquipmentSeeder.
 *
 * The same shape as Muscle (app/Models/Muscle.php). The class Equipment reads
 * the table `equipment`, without an "s": Laravel knows the word is
 * uncountable (D3.2.2).
 */
#[Fillable(['slug', 'name'])]
class Equipment extends Model
{
    // HasFactory: Equipment::factory() for tests. HasTranslations: see Muscle
    /** @use HasFactory<EquipmentFactory> */
    use HasFactory, HasTranslations;

    /**
     * The columns HasTranslations manages.
     *
     * @var list<string>
     */
    public array $translatable = ['name'];

    /**
     * The exercises that use this equipment.
     *
     * hasMany() is the "one to many" relation, seen from the "one" side: the
     * exercises table has an equipment_id column pointing here, and Laravel
     * works out its name from this model's (equipment + _id). The other side
     * is Exercise::equipment(), a belongsTo.
     *
     * @return HasMany<Exercise, $this>
     */
    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
