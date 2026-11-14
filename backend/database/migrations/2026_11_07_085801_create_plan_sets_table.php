<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The planned sets of a plan item, warm-ups included: one row per set, because
 * each has its own type and targets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_sets', function (Blueprint $table) {
            // A plain number: nothing points to these rows, and a save rewrites
            // them
            $table->id();

            $table->foreignUuid('plan_item_id')->constrained()->cascadeOnDelete();

            $table->integer('position');

            $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');

            // "8–10" is 8 and 10, "8" is 8 and 8
            $table->integer('target_reps_min')->nullable();
            $table->integer('target_reps_max')->nullable();

            // Kilograms, exact
            $table->decimal('target_weight_kg', 7, 3)->nullable();

            $table->decimal('target_rpe', 3, 1)->nullable();

            // For exercises logged by time or distance
            $table->integer('target_duration_seconds')->nullable();
            $table->integer('target_distance_meters')->nullable();

            // No timestamps: rows rewritten on every save have no history
            $table->index(['plan_item_id', 'position']);
        });

        // Not expressible with Blueprint. Named, so the error says which rule
        // fired; a null value passes
        DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
            CHECK (target_reps_min <= target_reps_max)');
        DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_rpe_range
            CHECK (target_rpe BETWEEN 1 AND 10)');
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_sets');
    }
};
