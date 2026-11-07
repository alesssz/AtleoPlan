<?php

// Imports: as in every migration (the plans one explains them)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `plan_items`: one exercise in one day of a plan, with its rest,
 * its notes and its place in a superset (docs/design/D3-data-model.md
 * D3.5.3). Its sets are rows of `plan_sets`.
 *
 * Why this table, rather than days pointing straight at exercises: the same
 * exercise can appear on many days and in many plans, each time with its own
 * rest and sets.
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('plan_items', function (Blueprint $table) {
            // A UUID created on the device, kept across saves (D3.5.6)
            $table->uuid('id')->primary();

            // The day it is in; deleting the day deletes it
            $table->foreignUuid('plan_day_id')->constrained()->cascadeOnDelete();

            // The exercise. Nothing after constrained(): Postgres refuses to
            // delete an exercise for good while a plan uses it. Exercises are
            // soft-deleted instead, and the plan keeps showing them (D3.7.2).
            // Its own index, since "which plans use this exercise" searches it
            $table->foreignId('exercise_id')->index()->constrained();

            // The order within the day, from 0 (D3.2.7)
            $table->integer('position');

            // Items of one day with the same number form a superset: two or
            // more exercises done in turn (D1.4.8). The number means nothing
            // but "same or different"; empty: not in a superset. smallInteger:
            // a smaller whole number, up to 32767
            $table->smallInteger('superset_group')->nullable();

            // The rest after each set, in seconds. Empty: the user's
            // default_rest_seconds (D3.3)
            $table->integer('rest_seconds')->nullable();

            // "Shoulder blades back"
            $table->text('notes')->nullable();

            $table->timestamps();

            // "The items of this day, in order"
            $table->index(['plan_day_id', 'position']);
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_items');
    }
};
