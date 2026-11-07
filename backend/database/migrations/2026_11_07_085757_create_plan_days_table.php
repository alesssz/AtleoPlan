<?php

// Imports: as in every migration (the plans one explains them)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `plan_days`: the training days of a plan, such as "Day A – Push"
 * (docs/design/D3-data-model.md D3.5.2). Their order is the order the
 * suggested day follows (docs/design/D2-decisions.md D2.8).
 *
 * Runs after the plans migration, which it points to: the date and time at
 * the start of the file name decide the order.
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('plan_days', function (Blueprint $table) {
            // A UUID, created on the device like the plan's (D3.2.1). It
            // stays the same across saves, because sessions will point to it
            // (D3.5.6)
            $table->uuid('id')->primary();

            // The plan it belongs to. foreignUuid(): the plan's id is a UUID,
            // so this column is one too (foreignId() would make a bigint).
            // cascadeOnDelete(): deleting the plan deletes its days. No
            // index() here: the index on [plan_id, position] below also
            // serves searches on plan_id alone (D3.2.6)
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();

            // "Day A – Push"
            $table->string('name');

            // The order, from 0. Rows have no order of their own, so whatever
            // the user can reorder has a position (D3.2.7). Not unique, on
            // purpose: during a reorder two rows may briefly share one
            $table->integer('position');

            $table->timestamps();

            // One index on two columns: "the days of this plan, in order"
            $table->index(['plan_id', 'position']);
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_days');
    }
};
