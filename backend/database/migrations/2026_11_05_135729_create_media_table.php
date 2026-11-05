<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The `media` table of spatie/laravel-medialibrary: one row per photo or video
 * attached to any model (an exercise's photos and videos, later a user's
 * avatar). The files live on a Laravel disk; this row says where, and which
 * resized versions exist (docs/02-decisions.md 2.5).
 *
 * Published from the package (vendor:publish --tag=medialibrary-migrations),
 * with comments added; the columns are the package's own and must stay as
 * they are, since the package reads and writes them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();

            // The model the file belongs to: model_type (class) + model_id
            $table->morphs('model');
            // Stable public identifier of the file, used in URLs instead of the id
            $table->uuid()->nullable()->unique();
            // Group inside the model, e.g. "photos" or "videos" of an exercise
            $table->string('collection_name');
            // Display name, and the file's name on the disk
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            // Laravel disk of the original, and of the converted versions if different
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            // Size of the original in bytes
            $table->unsignedBigInteger('size');
            // Package bookkeeping: edits asked, free properties, conversions
            // already generated (WebP, thumbnail, video poster), responsive sizes
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            // Position within the collection, for drag-and-drop ordering
            $table->unsignedInteger('order_column')->nullable()->index();

            $table->nullableTimestamps();
        });
    }
};
