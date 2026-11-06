<?php

namespace Database\Seeders;

// Imports: the model to write, and Laravel's base Seeder
use App\Models\Equipment;
use Illuminate\Database\Seeder;

/**
 * Writes the 12 kinds of equipment of the library, in the four languages of
 * the app (docs/design/D3-data-model.md D3.4.1). The same shape as
 * MuscleSeeder, which explains it; also run on the server.
 *
 * The slugs are free-exercise-db's values with dashes for spaces
 * ("e-z curl bar" → "e-z-curl-bar"), so that the import finds them.
 */
class EquipmentSeeder extends Seeder
{
    /**
     * slug => name in each language.
     *
     * @var array<string, array<string, string>>
     */
    private const EQUIPMENT = [
        'barbell' => ['en' => 'Barbell', 'it' => 'Bilanciere', 'es' => 'Barra', 'de' => 'Langhantel'],
        'dumbbell' => ['en' => 'Dumbbells', 'it' => 'Manubri', 'es' => 'Mancuernas', 'de' => 'Kurzhanteln'],
        'cable' => ['en' => 'Cable', 'it' => 'Cavi', 'es' => 'Polea', 'de' => 'Kabelzug'],
        'machine' => ['en' => 'Machine', 'it' => 'Macchina', 'es' => 'Máquina', 'de' => 'Maschine'],
        'kettlebells' => ['en' => 'Kettlebells', 'it' => 'Kettlebell', 'es' => 'Kettlebells', 'de' => 'Kettlebells'],
        'bands' => ['en' => 'Bands', 'it' => 'Elastici', 'es' => 'Bandas elásticas', 'de' => 'Widerstandsbänder'],
        'e-z-curl-bar' => ['en' => 'EZ curl bar', 'it' => 'Bilanciere EZ', 'es' => 'Barra EZ', 'de' => 'SZ-Stange'],
        'medicine-ball' => ['en' => 'Medicine ball', 'it' => 'Palla medica', 'es' => 'Balón medicinal', 'de' => 'Medizinball'],
        'exercise-ball' => ['en' => 'Exercise ball', 'it' => 'Fitball', 'es' => 'Fitball', 'de' => 'Gymnastikball'],
        'foam-roll' => ['en' => 'Foam roller', 'it' => 'Rullo in schiuma', 'es' => 'Rodillo de espuma', 'de' => 'Faszienrolle'],
        'body-only' => ['en' => 'Body weight', 'it' => 'Corpo libero', 'es' => 'Peso corporal', 'de' => 'Körpergewicht'],
        'other' => ['en' => 'Other', 'it' => 'Altro', 'es' => 'Otro', 'de' => 'Sonstiges'],
    ];

    /**
     * Writes the equipment: updated if the slug exists, created if not.
     */
    public function run(): void
    {
        foreach (self::EQUIPMENT as $slug => $name) {
            Equipment::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
