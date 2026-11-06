<?php

namespace Database\Seeders;

// The namespace above maps to the database/seeders folder (docs/concepts/C2-backend.md C2.2).

// Imports: the model to create, and Laravel's base Seeder with one of its traits
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Fills the development database with starting data (docs/concepts/C2-backend.md C2.6).
 *
 * A seeder is a class whose run() inserts rows. This one is the entry point:
 * `php artisan db:seed` runs it, and `make fresh` (`migrate:fresh --seed`)
 * empties the database, runs every migration again and then runs it. Bigger
 * data sets go in their own seeders, called from here with `$this->call()`.
 * The test database is not seeded: each test creates what it needs with
 * factories.
 *
 * The public exercise library is not seeded here: it comes from outside, so
 * it is an Artisan command of its own, `make exercises-import`
 * (app/Console/Commands/ImportFreeExerciseDb.php), to run after `make fresh`
 * (docs/concepts/C2-backend.md C2.14).
 */
class DatabaseSeeder extends Seeder
{
    // A trait (a bundle of methods added to the class): while seeding, models
    // fire no events, so listeners such as "send a welcome email when a user
    // is created" stay silent
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * First the fixed lists the app needs, muscles and equipment
     * (docs/design/D3-data-model.md D3.4.1); they come first because exercises
     * will point to them. Then the account to sign in with in development:
     * test@example.com, password `password` (from UserFactory). It is an admin,
     * so it opens the Filament panel too.
     */
    public function run(): void
    {
        // $this->call() runs other seeders, in this order. Each can also run
        // alone: make artisan c="db:seed --class=MuscleSeeder"
        $this->call([
            MuscleSeeder::class,
            EquipmentSeeder::class,
        ]);

        // Laravel's example: ten random users
        // User::factory(10)->create();

        // User::factory() (a static call: `::` calls a method of the class
        // itself) gets the UserFactory; admin() is its state for an admin;
        // create() saves one user with these values, the other columns filled
        // in by the factory
        User::factory()->admin()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
