<?php

// Imports: as in every migration (the plans one explains them)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `session_exercises`: one exercise as done in one session
 * (docs/design/D3-data-model.md D3.6.2). Its sets are rows of `logged_sets`.
 *
 * Why a table between the session and its sets: it holds the order of the
 * exercises, a note on one of them, and an exercise that was skipped (a row
 * with no sets).
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('session_exercises', function (Blueprint $table) {
            // A UUID made on the device
            $table->uuid('id')->primary();

            // The session it belongs to; deleting the session for good
            // deletes it
            $table->foreignUuid('workout_session_id')->constrained()->cascadeOnDelete();

            // The exercise actually done, which after a swap is not the
            // plan's. Refused while in use: exercises are soft-deleted
            // instead, and history keeps showing them (D3.7.2)
            $table->foreignId('exercise_id')->index()->constrained();

            // The plan's slot it filled; empty when added on the fly, or
            // once the plan item is deleted
            $table->foreignUuid('plan_item_id')->nullable()->index()->constrained()->nullOnDelete();

            // The order within the session, from 0 (D3.2.7)
            $table->integer('position');

            // Copied from the plan item when the session starts
            $table->smallInteger('superset_group')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            // "The exercises of this session, in order"
            $table->index(['workout_session_id', 'position']);
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_exercises');
    }
};
