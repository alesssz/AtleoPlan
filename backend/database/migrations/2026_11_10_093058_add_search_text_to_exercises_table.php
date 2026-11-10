<?php

// Imports: as in every migration (the plans one explains them), plus the DB
// facade, to fill the new column, and the class that builds its text
use App\Support\SearchText;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `exercises.search_text`: the name and aliases of an exercise in every
 * language, normalised by App\Support\SearchText, the text the library's
 * search looks in (docs/design/D3-data-model.md D3.4.6).
 *
 * The model fills it every time an exercise is saved (Exercise::booted());
 * this migration fills it once for the rows that already exist. It is the
 * first migration of the project that writes data, not only structure:
 * how such a migration is built, and why it reads the rows with the DB
 * facade rather than with the model, is in docs/how-to/H1-database.md H1.16.
 */
return new class extends Migration
{
    /**
     * Adds the column, then fills it for every existing exercise.
     */
    public function up(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            // text: no length limit (an exercise with many aliases is long).
            // default(''): rows are never null, and the fill below replaces it
            $table->text('search_text')->default('');
        });

        // Every row, deleted ones included, a thousand at a time: lazyById()
        // reads them in chunks ordered by id, so memory stays small however
        // many exercises there are. The DB facade gives plain rows (stdClass)
        // with the JSON columns as text, decoded here by hand
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
     * Removes the column again; the search then has nothing to look in, so
     * this only makes sense together with going back to the code before it.
     */
    public function down(): void
    {
        Schema::table('exercises', function (Blueprint $table) {
            $table->dropColumn('search_text');
        });
    }
};
