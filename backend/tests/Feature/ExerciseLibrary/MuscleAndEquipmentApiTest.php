<?php

/**
 * GET /api/muscles and GET /api/equipment: the two fixed lists of the
 * library's filters and editor, read from the real seeders, sorted by name in
 * the request's language.
 */

use App\Models\User;
use Database\Seeders\EquipmentSeeder;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('answers 401 to a visitor', function (string $url) {
    $this->getJson($url)->assertUnauthorized();
})->with(['/api/muscles', '/api/equipment']);

it('lists the 17 muscles, sorted by name in the request\'s language', function () {
    $this->seed(MuscleSeeder::class);

    // The names in Spanish, in the order received
    $names = $this->actingAs(User::factory()->create())
        ->getJson('/api/muscles', ['Accept-Language' => 'es'])
        ->assertOk()
        ->assertJsonCount(17, 'data')
        ->assertJsonPath('data.0', fn (array $first) => array_keys($first) === ['id', 'slug', 'name'])
        ->json('data.*.name');

    // Collator puts "Cuádriceps" before "Cuello"; comparing bytes, it would
    // come after it, because "á" is a byte above "e"
    expect(array_search('Cuádriceps', $names))->toBeLessThan(array_search('Cuello', $names))
        ->and($names[0])->toBe('Abdominales');
});

it('lists the 12 kinds of equipment, sorted by name in the request\'s language', function () {
    $this->seed(EquipmentSeeder::class);

    $this->actingAs(User::factory()->create())
        ->getJson('/api/equipment', ['Accept-Language' => 'it'])
        ->assertOk()
        ->assertJsonCount(12, 'data')
        // Altro (other) is the first in Italian, Rullo in schiuma (foam roller) the last
        ->assertJsonPath('data.0.name', 'Altro')
        ->assertJsonPath('data.11.name', 'Rullo in schiuma');
});
