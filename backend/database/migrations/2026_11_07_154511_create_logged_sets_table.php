<?php

// Imports: as in every migration (the plans one explains them), plus the DB
// facade for the check constraints
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `logged_sets`: one completed set, the tap on ✓
 * (docs/design/D3-data-model.md D3.6.3). A row exists only once a set is
 * ticked: the sets still to do come from the plan.
 *
 * Unlike `plan_sets`, its id is a UUID made on the device, because a set is
 * created offline and may be sent twice (D3.2.1).
 */
return new class extends Migration
{
    /**
     * Creates the table and its check constraints.
     */
    public function up(): void
    {
        Schema::create('logged_sets', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // The exercise of the session it belongs to
            $table->foreignUuid('session_exercise_id')->constrained()->cascadeOnDelete();

            // The order within the exercise, from 0
            $table->integer('position');

            // What was really done: the type can change during a workout.
            // Warm-ups count neither for volume nor for records (D2.8)
            $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');

            // The values; which ones are filled depends on how the exercise
            // is logged (weight and reps, reps, time, distance; D3.6.3).
            // Weights always in kilograms, exact (D3.2.3)
            $table->decimal('weight_kg', 7, 3)->nullable();
            $table->integer('reps')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->integer('distance_meters')->nullable();

            // The moment of the tap, from the device's clock
            $table->timestampTz('completed_at');

            $table->timestamps();

            // "The sets of this exercise, in order"
            $table->index(['session_exercise_id', 'position']);
        });

        DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_weight_not_negative CHECK (weight_kg >= 0)');
        DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_reps_not_negative CHECK (reps >= 0)');
    }

    /**
     * Drops the table again; its constraints go with it.
     */
    public function down(): void
    {
        Schema::dropIfExists('logged_sets');
    }
};
