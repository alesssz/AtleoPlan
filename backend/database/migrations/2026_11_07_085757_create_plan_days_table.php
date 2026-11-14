<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The training days of a plan, in the order the suggested day follows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_days', function (Blueprint $table) {
            // Made on the device and kept across saves: sessions point to it
            $table->uuid('id')->primary();

            // No index of its own: [plan_id, position] serves it
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();

            $table->string('name');

            // From 0. Not unique: two rows may briefly share one during a
            // reorder
            $table->integer('position');

            $table->timestamps();

            $table->index(['plan_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_days');
    }
};
