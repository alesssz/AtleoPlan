<?php

namespace App\Models;

// Imports: the enum of logging_type, the attribute and traits used below, the
// types of the three relations, and the two packages' pieces (translations,
// photos and videos)
use App\Enums\LoggingType;
use Database\Factories\ExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Translatable\HasTranslations;

/**
 * An exercise of the library: one row of `exercises`
 * (docs/design/D3-data-model.md D3.4.2).
 *
 * Public when owner_id is empty (seen by everyone, managed by admins, filled by
 * the free-exercise-db import), personal when it is filled (seen and edited
 * only by its owner); docs/design/D2-decisions.md D2.3.
 *
 * Three packages and traits shape it:
 * - HasTranslations: name, aliases, description and instructions hold one
 *   value per language, and `$exercise->name` gives the current language's,
 *   falling back to English, then to any language there is (the fallback is
 *   set in AppServiceProvider; D3.4.5).
 * - SoftDeletes: delete() only fills deleted_at, and every query then leaves
 *   the row out; plans and history that point to it keep working (D3.7.2).
 *   `Exercise::withTrashed()` includes those rows again.
 * - InteractsWithMedia (spatie/laravel-medialibrary): the photos and videos,
 *   stored as rows of the `media` table, in the collections registered below
 *   (D3.4.4). `implements HasMedia` is the interface the package asks for.
 *
 * Fillable lists what a user may set on their own exercise. owner_id is not
 * in it: the code sets it, as in `$user->exercises()->create($data)`, so no
 * request can give an exercise to someone else. external_id, level, category
 * and machine_translated belong to the import, which writes them directly.
 */
#[Fillable(['name', 'aliases', 'description', 'instructions', 'logging_type', 'equipment_id', 'youtube_url'])]
class Exercise extends Model implements HasMedia
{
    // HasFactory: Exercise::factory() for tests. The others: see above
    /** @use HasFactory<ExerciseFactory> */
    use HasFactory, HasTranslations, InteractsWithMedia, SoftDeletes;

    /**
     * The columns HasTranslations manages. aliases and instructions hold a
     * list per language: {"en": ["Lie on the bench.", "Lower the bar."]}.
     *
     * @var list<string>
     */
    public array $translatable = ['name', 'aliases', 'description', 'instructions'];

    /**
     * The casts (what a cast is: app/Models/User.php):
     * - logging_type becomes the enum LoggingType;
     * - machine_translated is JSON in the database and a PHP array here,
     *   such as ['es', 'de'].
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'logging_type' => LoggingType::class,
            'machine_translated' => 'array',
        ];
    }

    /**
     * The values a new exercise gets before it is saved.
     *
     * The table has the same defaults, but a new model does not read them
     * back from the database: without these, `$exercise->logging_type` would
     * be null until the exercise is loaded again.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'logging_type' => 'weight_reps',
        'machine_translated' => '[]',
    ];

    /**
     * Whose exercise it is: null for a public one.
     *
     * belongsTo() is the other side of hasMany(): this table has the column
     * pointing to the other. The column is owner_id, not the user_id Laravel
     * would guess from the class User, so it is given.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * The equipment it needs, if any (equipment_id; null for body weight
     * exercises without a value).
     *
     * @return BelongsTo<Equipment, $this>
     */
    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    /**
     * The muscles it works, each with its role in `pivot->role`
     * (D3.4.3). How the pivot table and ExerciseMuscle fit: Muscle::exercises().
     *
     * Adding one: `$exercise->muscles()->attach($chest, ['role' => MuscleRole::Primary])`.
     *
     * @return BelongsToMany<Muscle, $this, ExerciseMuscle>
     */
    public function muscles(): BelongsToMany
    {
        return $this->belongsToMany(Muscle::class)->using(ExerciseMuscle::class)->withPivot('role');
    }

    /**
     * Whether everyone sees it (no owner).
     */
    public function isPublic(): bool
    {
        return $this->owner_id === null;
    }

    /**
     * The media collections: named groups of files, each with the file types
     * it accepts (docs/design/D2-decisions.md D2.5). medialibrary calls this
     * method itself. The limits on number and size, and the conversion to
     * WebP and 720p, come with the upload endpoint (BE-1).
     */
    public function registerMediaCollections(): void
    {
        // The photos, in the order chosen in the editor; the first is the cover
        $this->addMediaCollection('photos')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

        // The videos: mp4, mov (as iPhones record them) and webm
        $this->addMediaCollection('videos')
            ->acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/webm']);
    }
}
