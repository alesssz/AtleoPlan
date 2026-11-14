<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An exercise in a day of a plan, with its own rest, notes and superset: the
 * same exercise can appear on many days, each time with its own sets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_items', function (Blueprint $table) {
            // Made on the device and kept across saves
            $table->uuid('id')->primary();

            $table->foreignUuid('plan_day_id')->constrained()->cascadeOnDelete();

            // No cascade: an exercise in use cannot be deleted for good. It is
            // soft-deleted instead, and the plan keeps showing it
            $table->foreignId('exercise_id')->index()->constrained();

            $table->integer('position');

            // Items of a day with the same number form a superset; the number
            // means only "same or different"
            $table->smallInteger('superset_group')->nullable();

            // Null: the user's default_rest_seconds
            $table->integer('rest_seconds')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['plan_day_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_items');
    }
};
