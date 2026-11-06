<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `exercise_muscle`: which muscles each exercise works, and how
 * (docs/design/D3-data-model.md D3.4.3).
 *
 * A "pivot" table: it links two tables many-to-many. An exercise works
 * several muscles, and a muscle is worked by many exercises, so neither table
 * can hold a single column for the other; each row here is one pair. Its name
 * follows Laravel's convention, the two tables in the singular and in
 * alphabetical order, so Exercise::muscles() finds it by itself.
 *
 * It has no model and no id of its own: the pair is the primary key.
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('exercise_muscle', function (Blueprint $table) {
            // The exercise. constrained() works out the table from the column's
            // name (exercise_id → exercises). cascadeOnDelete(): when an
            // exercise is really deleted, its rows here go with it (D3.7).
            // No ->index(): the primary key below starts with this column, and
            // that index serves searches on it too
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            // The muscle. Refused if the muscle is deleted while in use. It has
            // its own index, for "the exercises of this muscle" (the filters)
            $table->foreignId('muscle_id')->index()->constrained();
            // Whether the muscle is a main target or a helper. free-exercise-db
            // allows several primary muscles, so it is a role per pair rather
            // than one column on exercises. Read as App\Enums\MuscleRole
            $table->enum('role', ['primary', 'secondary']);
            // The primary key is the pair: a muscle cannot appear twice on the
            // same exercise
            $table->primary(['exercise_id', 'muscle_id']);
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercise_muscle');
    }
};
