<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The exercise library: public when owner_id is null, personal otherwise.
 * Photos and videos live in `media`, muscles in `exercise_muscle`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            // A number, not a UUID: media rows link to a numeric model_id, and
            // exercises are created only online
            $table->id();

            // No cascade: a user who still owns exercises cannot be deleted
            // until the code removes them. index() before constrained(), which
            // returns another object
            $table->foreignId('owner_id')->nullable()->index()->constrained('users');

            // free-exercise-db's id, so the import updates rather than duplicates
            $table->string('external_id')->nullable()->unique();

            $table->foreignId('equipment_id')->nullable()->index()->constrained('equipment');

            // One value per language; aliases and instructions hold a list per
            // language
            $table->jsonb('name');
            $table->jsonb('aliases')->nullable();
            $table->jsonb('description')->nullable();
            $table->jsonb('instructions')->nullable();

            // What a set records
            $table->enum('logging_type', ['weight_reps', 'reps', 'time', 'distance'])->default('weight_reps');

            // From the import, not shown yet: beginner, intermediate, expert
            $table->string('level')->nullable();
            // From the import, not shown yet: strength, stretching, cardio…
            $table->string('category')->nullable();

            // Languages machine-translated and not yet reviewed, ["es", "de"]
            $table->jsonb('machine_translated')->default('[]');

            $table->string('youtube_url')->nullable();

            $table->timestamps();
            // Plans and history that point to a deleted exercise keep working
            $table->softDeletesTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
