<?php

namespace Database\Seeders;

// The namespace above maps to the database/seeders folder (docs/05-backend.md 5.2).

// Imports: the model to create, and Laravel's base Seeder with one of its traits
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Fills the development database with starting data (docs/05-backend.md 5.6).
 *
 * A seeder is a class whose run() inserts rows. This one is the entry point:
 * `php artisan db:seed` runs it, and `make fresh` (`migrate:fresh --seed`)
 * empties the database, runs every migration again and then runs it. Bigger
 * data sets go in their own seeders, called from here with `$this->call()`.
 * The test database is not seeded: each test creates what it needs with
 * factories.
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
     * Creates the account to sign in with in development:
     * test@example.com, password `password` (from UserFactory).
     */
    public function run(): void
    {
        // Laravel's example: ten random users
        // User::factory(10)->create();

        // User::factory() (a static call: `::` calls a method of the class
        // itself) gets the UserFactory; create() saves one user with these
        // values, the other columns filled in by the factory
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
