<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which muscles each exercise works, and how. The pair is the primary key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_muscle', function (Blueprint $table) {
            // No index of its own: the primary key starts with this column
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            // Indexed for the library's muscle filter
            $table->foreignId('muscle_id')->index()->constrained();
            // A role per pair: free-exercise-db allows several primary muscles
            $table->enum('role', ['primary', 'secondary']);
            $table->primary(['exercise_id', 'muscle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_muscle');
    }
};
