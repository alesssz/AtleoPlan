<?php

/**
 * The seeders of the library's fixed lists: MuscleSeeder and EquipmentSeeder
 * (docs/design/D3-data-model.md D3.4.1).
 *
 * They are run on every database, the server's included, and may run again
 * at any time, so the tests check the counts, the four languages, and that a
 * second run changes nothing. RefreshDatabase gives each test empty tables on
 * atleoplan_test (docs/how-to/H1-database.md H1.8).
 */

use App\Enums\Locale;
use App\Models\Equipment;
use App\Models\Muscle;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('writes the 17 muscles and the 12 kinds of equipment', function () {
    // $this->seed() runs a seeder inside the test
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
        // getTranslations() gives every language at once: ['en' => …, 'it' => …]
        $names = $row->getTranslations('name');
        // The second argument of expect() names the row in a failure message
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
    // With no class, seed() runs DatabaseSeeder
    $this->seed();

    expect(Muscle::count())->toBe(17)
        ->and(Equipment::count())->toBe(12);
});
