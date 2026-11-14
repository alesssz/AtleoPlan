<?php

/**
 * The seeders of the library's fixed lists: MuscleSeeder and EquipmentSeeder.
 *
 * They are run on every database, the server's included, and may run again
 * at any time, so the tests check the counts, the four languages, and that a
 * second run changes nothing.
 */

use App\Enums\Locale;
use App\Models\Equipment;
use App\Models\Muscle;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('writes the 17 muscles and the 12 kinds of equipment', function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);

    expect(Muscle::count())->toBe(17)
        ->and(Equipment::count())->toBe(12);
    // The slugs the free-exercise-db import will look for
    $this->assertDatabaseHas('muscles', ['slug' => 'lower-back']);
    $this->assertDatabaseHas('equipment', ['slug' => 'e-z-curl-bar']);
});

it('names every row in the four languages', function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);

    // Every muscle and every kind of equipment, as one list
    $rows = Muscle::all()->concat(Equipment::all());

    foreach ($rows as $row) {
        $names = $row->getTranslations('name');
        expect(array_keys($names))->toEqualCanonicalizing(Locale::codes(), $row->slug);
        expect(array_filter($names))->toHaveCount(4, $row->slug);
    }
});

it('can run again without duplicating anything', function () {
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);
    $this->seed([MuscleSeeder::class, EquipmentSeeder::class]);

    expect(Muscle::count())->toBe(17)
        ->and(Equipment::count())->toBe(12);
});

it('runs from DatabaseSeeder, so make fresh fills them too', function () {
    $this->seed();

    expect(Muscle::count())->toBe(17)
        ->and(Equipment::count())->toBe(12);
});
