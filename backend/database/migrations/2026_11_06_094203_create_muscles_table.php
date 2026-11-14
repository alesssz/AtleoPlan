<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The muscle groups of the exercise library, written by MuscleSeeder.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('muscles', function (Blueprint $table) {
            // A number, not a UUID: muscles are created only on the server
            $table->id();
            // Code, seeders and the import find a muscle by it, never by an
            // id that may differ between databases
            $table->string('slug')->unique();
            // {"en": "Chest", "it": "Petto"}
            $table->jsonb('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('muscles');
    }
};
