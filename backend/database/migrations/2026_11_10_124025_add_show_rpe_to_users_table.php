<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `users.show_rpe`: whether the plan editor shows the RPE field beside
 * each set's reps (docs/design/D3-data-model.md D3.3, D1.4.14). Off by
 * default: most people never set a target effort, and the field took a
 * third of the row.
 */
return new class extends Migration
{
    /**
     * Adds the column. The default fills the users already there, and any
     * new one: everyone starts with the field hidden.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('show_rpe')->default(false);
        });
    }

    /**
     * Removes it again (`make artisan c="migrate:rollback"`).
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('show_rpe');
        });
    }
};
