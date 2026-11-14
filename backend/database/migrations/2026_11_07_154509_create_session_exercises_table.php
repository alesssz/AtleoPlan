<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An exercise as done in one session. It holds the order, a note, and a skipped
 * exercise (a row with no sets).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_exercises', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('workout_session_id')->constrained()->cascadeOnDelete();

            // What was actually done, not the plan's after a swap. No cascade:
            // exercises are soft-deleted, and history keeps showing them
            $table->foreignId('exercise_id')->index()->constrained();

            // Null for an exercise added during the workout, or once the plan
            // item is deleted
            $table->foreignUuid('plan_item_id')->nullable()->index()->constrained()->nullOnDelete();

            $table->integer('position');

            // Copied from the plan item when the session starts
            $table->smallInteger('superset_group')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['workout_session_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_exercises');
    }
};
