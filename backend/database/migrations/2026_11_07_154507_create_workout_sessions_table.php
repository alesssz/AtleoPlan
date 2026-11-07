<?php

// Imports: as in every migration (the plans one explains them), plus the DB
// facade for the check constraint
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `workout_sessions`: one workout, from the moment Start is tapped
 * (docs/design/D3-data-model.md D3.6.1). Created on the phone, usually sent to
 * the server later, so its id is a UUID made on the device (D3.2.1).
 *
 * The plan is what I meant to do, the session what I did (D3.1.3): a session
 * copies the plan's and the day's names, and survives when the plan is
 * changed or deleted.
 */
return new class extends Migration
{
    /**
     * Creates the table and its check constraint.
     */
    public function up(): void
    {
        Schema::create('workout_sessions', function (Blueprint $table) {
            // A UUID made on the device: a session can start with no network
            $table->uuid('id')->primary();

            // Whose workout. Deleting the user deletes their sessions (D3.7).
            // No index of its own: the one on [user_id, started_at] below
            // serves searches on user_id alone too (D3.2.6)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // The plan and the day it followed; both empty for a free
            // workout. nullOnDelete(): when the plan or the day goes, the
            // cell empties and the session stays (D3.7.1)
            $table->foreignUuid('plan_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->foreignUuid('plan_day_id')->nullable()->index()->constrained()->nullOnDelete();

            // Copies of the names when the session started: history keeps
            // saying "Push Pull Legs · Day A" after a rename or a delete
            $table->string('plan_name')->nullable();
            $table->string('day_name')->nullable();

            // When it started, and when it was finished: empty while in
            // progress, which is what Home's banner looks for (D1.4.2)
            $table->timestampTz('started_at');
            $table->timestampTz('finished_at')->nullable();

            // The time actually trained, counted by the device: a session
            // left open overnight would otherwise last fourteen hours
            $table->integer('duration_seconds')->nullable();

            // The summary's "how did it feel", 1 to 5, and free notes (D1.4.10)
            $table->smallInteger('feeling')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            // deleted_at: a soft delete, so a late send of a deleted session
            // finds it, sees it is deleted, and does not bring it back (D3.7.3)
            $table->softDeletesTz();

            // History: a user's sessions by date
            $table->index(['user_id', 'started_at']);
        });

        // Named, so the error says which rule fired (D3.2.8)
        DB::statement('ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_feeling_range
            CHECK (feeling BETWEEN 1 AND 5)');
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_sessions');
    }
};
