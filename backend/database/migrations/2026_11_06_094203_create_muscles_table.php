<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `muscles`: the 17 muscle groups of the exercise library, such as
 * chest or lower back (docs/design/D3-data-model.md D3.4.1).
 *
 * They are used by the library's filters and by the volume per muscle group;
 * which muscles an exercise works is in the `exercise_muscle` table. The rows
 * themselves are written by database/seeders/MuscleSeeder.php.
 *
 * The file returns an anonymous class (a class with no name, created on the
 * spot): Laravel creates it and calls up() to apply the change, or down() to
 * undo it (`make artisan c="migrate:rollback"`). How migrations work, step by
 * step: docs/how-to/H1-database.md H1.2.
 */
return new class extends Migration
{
    /**
     * Creates the table. Schema::create() receives a function, and each call
     * on its $table (a Blueprint) adds a column.
     */
    public function up(): void
    {
        Schema::create('muscles', function (Blueprint $table) {
            // The id: a bigint that grows by itself, and the primary key.
            // A number rather than a UUID, because muscles are created only
            // on the server (D3.2.1)
            $table->id();
            // A stable English key, such as "lower-back". Code, seeders and
            // the import find a muscle by it, never by its id, which may differ
            // from one database to another. unique() refuses duplicates
            $table->string('slug')->unique();
            // The name in every language, one JSON object:
            // {"en": "Chest", "it": "Petto"}. jsonb is Postgres's binary JSON,
            // which can be searched inside. The model's HasTranslations trait
            // reads the current language from it
            $table->jsonb('name');
            // created_at and updated_at, filled in by Laravel
            $table->timestamps();
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('muscles');
    }
};
