<?php

/**
 * Creates the tables of Laravel's database queue. Shipped with Laravel;
 * comments added.
 *
 * A job is a task run later, in the background, so the user does not wait for
 * it: sending an email, converting an uploaded video with ffmpeg. The app
 * stores the job in the `jobs` table (QUEUE_CONNECTION=database, set in
 * compose.yaml: no Redis to run) and the `queue` container runs it
 * (`php artisan queue:listen`) (docs/concepts/C2-backend.md C2.9). How migrations work:
 * see the header of 0001_01_01_000000_create_users_table.php and
 * docs/concepts/C2-backend.md C2.6.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The migration is an anonymous class (a class with no name), returned to Laravel
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema::create (a facade: a static-looking call Laravel passes to the
     * database's schema builder) creates each table from the columns added to
     * the Blueprint $table.
     */
    public function up(): void
    {
        // Jobs waiting to run, or running; a job's row is deleted when it succeeds
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            // The queue's name ("default" unless a job asks for another);
            // workers pick jobs by queue
            $table->string('queue')->index();
            // The job's class and data, serialized as JSON
            $table->longText('payload');
            // How many times it has been tried (queue:listen --tries=3)
            $table->unsignedSmallInteger('attempts');
            // Times as Unix timestamps: when a worker took it (NULL = free),
            // when it may run (later than created_at for a delayed job), and
            // when it was queued
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        // Batches (Bus::batch): a group of jobs followed as one, with progress
        // and a callback when all are done
        Schema::create('job_batches', function (Blueprint $table) {
            // The batch's UUID
            $table->string('id')->primary();
            $table->string('name');
            // Counters: jobs in total, still to run, failed
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            // The ids of the failed jobs, as JSON
            $table->longText('failed_job_ids');
            // The batch's settings and callbacks, serialized
            $table->mediumText('options')->nullable();
            // Unix timestamps of the batch's life
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        // Jobs that failed every try, kept to inspect and retry
        // (`php artisan queue:failed`, `queue:retry`)
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            // The job's UUID, used by queue:retry
            $table->string('uuid')->unique();
            // Where it ran: connection (e.g. "database") and queue name
            $table->string('connection');
            $table->string('queue');
            // The job, as it was queued
            $table->longText('payload');
            // The error and its stack trace
            $table->longText('exception');
            // When it failed; useCurrent() lets Postgres fill in "now"
            $table->timestamp('failed_at')->useCurrent();

            // One index on three columns, for listing failures by queue and date
            $table->index(['connection', 'queue', 'failed_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Called by `php artisan migrate:rollback`: deletes the three tables.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
    }
};
