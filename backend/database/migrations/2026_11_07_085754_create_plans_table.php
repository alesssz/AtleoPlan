<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Workout plans, the top of plan → days → items → sets. The id is a UUID made
 * on the device, so the editor can build a whole plan offline and a save sent
 * twice is recognised.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('goal')->nullable();
            $table->text('notes')->nullable();

            // +1 on every save; a smaller version sent by the editor means the
            // plan changed elsewhere meanwhile
            $table->integer('version')->default(1);

            // Hidden from the list unless asked for
            $table->timestampTz('archived_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
