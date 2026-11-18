<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Deleting a plan runs two actions on a session: plan_id emptied, and the
 * day deleted with the plan, which empties plan_day_id. Postgres picks their
 * order by trigger name, which ends in an OID compared as text. When plan_id
 * goes first, its UPDATE checks plan_day_id again if the row was inserted in
 * the same transaction, and the day is already gone. Checked at commit
 * instead, the key finds plan_day_id empty, whatever the order.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE workout_sessions ALTER CONSTRAINT workout_sessions_plan_day_id_foreign
            DEFERRABLE INITIALLY DEFERRED');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE workout_sessions ALTER CONSTRAINT workout_sessions_plan_day_id_foreign
            NOT DEFERRABLE');
    }
};
