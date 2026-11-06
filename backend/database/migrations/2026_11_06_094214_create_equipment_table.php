<?php

// Imports: the base Migration class, the Blueprint that describes a table, and
// Schema, the facade that changes the database (docs/concepts/C2-backend.md C2.6)
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates `equipment`: the 12 kinds of equipment of the exercise library,
 * such as barbell or cable (docs/design/D3-data-model.md D3.4.1).
 *
 * The same columns as `muscles`. The table is `equipment`, not `equipments`:
 * Laravel treats the word as uncountable, as English does, so the model
 * Equipment reads this table by itself (D3.2.2). The rows are written by
 * database/seeders/EquipmentSeeder.php.
 */
return new class extends Migration
{
    /**
     * Creates the table.
     */
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            // The id: a bigint that grows by itself, and the primary key
            $table->id();
            // A stable English key, such as "e-z-curl-bar"; unique
            $table->string('slug')->unique();
            // The name in every language, as JSON: {"en": "Barbell", "it": "Bilanciere"}
            $table->jsonb('name');
            // created_at and updated_at, filled in by Laravel
            $table->timestamps();
        });
    }

    /**
     * Drops the table again.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
