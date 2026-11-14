<?php

use App\Support\SearchText;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The text the library's search looks in: every name and alias, normalised. The
 * model keeps it up to date on every save (Exercise::booted()); this fills the
 * rows that already exist, through the DB facade rather than the model, which
 * may change later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->text('search_text')->default('');
        });

        // In chunks, deleted rows included; plain rows carry the JSON as text
        DB::table('exercises')->select(['id', 'name', 'aliases'])->lazyById(1000)->each(function (object $row) {
            DB::table('exercises')->where('id', $row->id)->update([
                'search_text' => SearchText::forExercise(
                    json_decode($row->name, true) ?? [],
                    json_decode($row->aliases ?? '{}', true) ?? [],
                ),
            ]);
        });
    }

    /**
     * Only meaningful together with going back to the code before it.
     */
    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn('search_text');
        });
    }
};
