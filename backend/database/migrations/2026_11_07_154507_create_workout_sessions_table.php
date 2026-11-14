<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A workout, from the moment Start is tapped. Made on the phone and usually
 * sent later, so the id is a UUID from the device.
 *
 * The plan is what was meant, the session what was done: it copies the plan's
 * and the day's names, and survives when the plan changes or goes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // No index of its own: [user_id, started_at] serves it
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Null for a free workout; emptied when the plan or the day goes
            $table->foreignUuid('plan_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->foreignUuid('plan_day_id')->nullable()->index()->constrained()->nullOnDelete();

            // Copies, so history keeps "Push Pull Legs · Day A" after a
            // rename or a delete
            $table->string('plan_name')->nullable();
            $table->string('day_name')->nullable();

            // Null while in progress: what Home's banner looks for
            $table->timestampTz('started_at');
            $table->timestampTz('finished_at')->nullable();

            // Counted by the device: a session left open overnight would
            // otherwise last fourteen hours
            $table->integer('duration_seconds')->nullable();

            // The summary's "how did it feel"
            $table->smallInteger('feeling')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            // A late send of a deleted session finds it deleted and does not
            // bring it back
            $table->softDeletesTz();

            $table->index(['user_id', 'started_at']);
        });

        // Named, so the error says which rule fired
        DB::statement('ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_feeling_range
            CHECK (feeling BETWEEN 1 AND 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_sessions');
    }
};
