<?php

// Imports: as in every migration (the plans one explains them)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `users.active_plan_id`: the one active plan of each user
 * (docs/design/D3-data-model.md D3.3, docs/design/D2-decisions.md D2.8).
 *
 * A column on the user rather than `plans.is_active`: one cell cannot hold
 * two plans, so "one active plan at a time" holds by construction, and
 * changing plan is one update. What the column cannot check by itself, that
 * the plan is the user's and not archived, PlanPolicy::activate() checks.
 *
 * A migration of its own, after the plans one: the foreign key needs the
 * table `plans` to exist. Schema::table(), not create(): the table exists,
 * and this changes it (docs/how-to/H1-database.md H1.3.3).
 */
return new class extends Migration
{
    /**
     * Adds the column and its foreign key.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // A UUID like the plans' id; empty: no active plan.
            // nullOnDelete(): deleting the plan empties the cell and keeps the
            // user (D3.7). constrained('plans'): the name active_plan_id does
            // not say the table, so it is given
            $table->foreignUuid('active_plan_id')->nullable()->index()->constrained('plans')->nullOnDelete();
        });
    }

    /**
     * Removes the column again.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // dropConstrainedForeignId(): drops the foreign key, its index and
            // the column, in that order (Postgres refuses to drop a column
            // that a foreign key still uses)
            $table->dropConstrainedForeignId('active_plan_id');
        });
    }
};
