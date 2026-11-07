<?php

// Imports: as in every migration (the plans one explains them), plus the DB
// facade, which runs plain SQL for the check constraints
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `plan_sets`: one planned set of a plan item, warm-ups included, with
 * its type and its targets (docs/design/D3-data-model.md D3.5.4).
 *
 * One row per set rather than "4 sets" on the item, because each set has its
 * own type and targets: the warm-up asks for 40 kg, the next set for 80 kg.
 */
return new class extends Migration
{
    /**
     * Creates the table and its two check constraints.
     */
    public function up(): void
    {
        Schema::create('plan_sets', function (Blueprint $table) {
            // A plain number, not a UUID: nothing points to these rows, and a
            // save deletes and writes them again rather than working out which
            // set changed (D3.5.6)
            $table->id();

            // The item it belongs to; deleting the item deletes its sets
            $table->foreignUuid('plan_item_id')->constrained()->cascadeOnDelete();

            // The order within the item, from 0
            $table->integer('position');

            // normal, warm_up, drop or failure: a text column with a check
            // constraint on Postgres. The model reads it as App\Enums\SetType
            $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');

            // The reps: "8–10" is 8 and 10, "8" is 8 and 8
            $table->integer('target_reps_min')->nullable();
            $table->integer('target_reps_max')->nullable();

            // Always in kilograms, exact: up to 9999.999 (D3.2.3).
            // decimal() makes Postgres's numeric(7,3)
            $table->decimal('target_weight_kg', 7, 3)->nullable();

            // How hard it should feel, from 1 to 10, with one decimal: 8.5
            $table->decimal('target_rpe', 3, 1)->nullable();

            // For exercises logged by time or by distance (D3.4.2)
            $table->integer('target_duration_seconds')->nullable();
            $table->integer('target_distance_meters')->nullable();

            // "The sets of this item, in order". No timestamps: rows that are
            // rewritten on every save have no history worth keeping
            $table->index(['plan_item_id', 'position']);
        });

        // Check constraints: Laravel's Blueprint has no method for them, so
        // they are written in SQL (D3.2.8). Named, so that the error says
        // which rule fired. A check passes when the value is empty, so these
        // do not make the columns required
        DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
            CHECK (target_reps_min <= target_reps_max)');
        DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_rpe_range
            CHECK (target_rpe BETWEEN 1 AND 10)');
    }

    /**
     * Drops the table again; its constraints go with it.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_sets');
    }
};
