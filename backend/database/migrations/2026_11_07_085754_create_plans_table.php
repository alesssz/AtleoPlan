<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `plans`: one row per workout plan, the top of the four levels
 * plan → days → items → sets (docs/design/D3-data-model.md D3.5.1).
 *
 * Its id is a UUID, created on the device rather than by Postgres, so that
 * the plan editor can build a whole plan, days and exercises included, with
 * no network, and a save sent twice is recognised (D3.2.1).
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            // A UUID primary key instead of $table->id(): a text of 36
            // characters such as "0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f20",
            // stored by Postgres in its own compact `uuid` type
            $table->uuid('id')->primary();

            // The owner. foreignId('user_id') makes a bigint column, and
            // constrained() works out the table `users` from the name.
            // cascadeOnDelete(): deleting the user deletes their plans
            // (D3.7). index() before constrained(), which returns another
            // object (D3.11)
            $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();

            // "Push Pull Legs"
            $table->string('name');
            // "Hypertrophy"; free text, may be empty
            $table->string('goal')->nullable();
            // Anything else the user wants to remember
            $table->text('notes')->nullable();

            // Starts at 1 and grows by 1 on every save. The editor sends the
            // version it started from, and a smaller number than this one
            // means the plan was changed somewhere else meanwhile (D3.5.7)
            $table->integer('version')->default(1);

            // Filled: archived, hidden from the list unless asked for (D1.4.6)
            $table->timestampTz('archived_at')->nullable();

            // created_at and updated_at, filled in by Laravel
            $table->timestamps();
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
