<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A completed set, the tap on ✓. Sets still to do come from the plan. Unlike
 * `plan_sets`, the id is a UUID from the device: a set is created offline and
 * may be sent twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logged_sets', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('session_exercise_id')->constrained()->cascadeOnDelete();

            $table->integer('position');

            // What was really done, which may differ from the plan. Warm-ups
            // count neither for volume nor for records
            $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');

            // Which are filled depends on how the exercise is logged;
            // kilograms, exact
            $table->decimal('weight_kg', 7, 3)->nullable();
            $table->integer('reps')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->integer('distance_meters')->nullable();

            // From the device's clock
            $table->timestampTz('completed_at');

            $table->timestamps();

            $table->index(['session_exercise_id', 'position']);
        });

        DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_weight_not_negative CHECK (weight_kg >= 0)');
        DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_reps_not_negative CHECK (reps >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('logged_sets');
    }
};
