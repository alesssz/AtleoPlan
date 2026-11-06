<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `exercises`: one row per exercise of the library
 * (docs/design/D3-data-model.md D3.4.2).
 *
 * An exercise is of one of two kinds (docs/design/D2-decisions.md D2.3):
 * - public, with an empty owner_id: seen by everyone, managed by admins,
 *   filled by the free-exercise-db import (DATA-1);
 * - personal, with owner_id filled: seen and edited only by its owner.
 *
 * Its photos and videos are not columns here: they are rows of the `media`
 * table of spatie/laravel-medialibrary (D3.4.4). The muscles it works are in
 * `exercise_muscle`.
 *
 * This migration runs after the ones for `users` and `equipment`, because it
 * points to them: the date at the start of the file name sets the order.
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            // The id: a bigint, not a UUID. The media table links a photo to
            // its owner through a numeric model_id, and exercises are created
            // only online, where the server can number them (D3.2.1)
            $table->id();

            // Who owns it: empty for a public exercise. foreignId() makes a
            // bigint column; constrained('users') adds a foreign key, so
            // Postgres refuses an id that is not in users.id (the name owner_id
            // does not say the table, so it is given). Nothing after it:
            // Postgres refuses to delete a user who still owns exercises; the
            // code deletes them first (D3.7). ->nullable() and ->index() go
            // before ->constrained(), which returns another object (D3.11)
            $table->foreignId('owner_id')->nullable()->index()->constrained('users');

            // The id in free-exercise-db, such as "Barbell_Bench_Press", so that
            // the import can run again and update rather than duplicate.
            // Empty for the exercises created in the app
            $table->string('external_id')->nullable()->unique();

            // The one kind of equipment it needs, if any. Refused if the
            // equipment row is deleted while exercises use it
            $table->foreignId('equipment_id')->nullable()->index()->constrained('equipment');

            // Translatable text, one value per language, read through the
            // model's HasTranslations trait (D3.4.5):
            // the name, required: {"en": "Barbell bench press", "it": "Panca piana…"}
            $table->jsonb('name');
            // other names, searched together with the name: {"it": ["panca"]}
            $table->jsonb('aliases')->nullable();
            // a short description
            $table->jsonb('description')->nullable();
            // the steps, a list per language, as free-exercise-db gives them
            $table->jsonb('instructions')->nullable();

            // What a set of this exercise records (D3.6.3): weight and reps,
            // reps only, a time or a distance. enum() is a text column with a
            // check constraint on Postgres: any other value is refused. The
            // model reads it as the PHP enum App\Enums\LoggingType
            $table->enum('logging_type', ['weight_reps', 'reps', 'time', 'distance'])->default('weight_reps');

            // From the import, not shown yet: beginner, intermediate, expert
            $table->string('level')->nullable();
            // From the import, not shown yet: strength, stretching, cardio…
            $table->string('category')->nullable();

            // The languages whose text was machine-translated and not yet
            // reviewed by a person, such as ["es", "de"]. A JSON list, empty by
            // default: default('[]') is the text of an empty JSON list
            $table->jsonb('machine_translated')->default('[]');

            // A YouTube link, the editor's alternative to uploading a video
            $table->string('youtube_url')->nullable();

            // created_at and updated_at, filled in by Laravel
            $table->timestamps();
            // deleted_at, for soft deletes: delete() fills it instead of
            // removing the row, so plans and history that point to the
            // exercise keep working (D3.7.2). The Tz version keeps the time zone
            $table->softDeletesTz();
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
