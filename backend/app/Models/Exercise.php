<?php

namespace App\Models;

// Imports: the enum of logging_type, the attribute and traits used below, the
// types of the three relations, and the two packages' pieces (translations,
// photos and videos)
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use Database\Factories\ExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
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
 *
 * The methods marked #[Scope] are query scopes: named pieces of a query, used
 * as `Exercise::visibleTo($user)->search('panca')->get()`. The library's list
 * (ExerciseController::index) is built from them
 * (docs/concepts/C2-backend.md C2.6, "Query scopes").
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
     * Whether it is this user's personal exercise.
     *
     * @param  User|null  $user  the user asking; null (nobody signed in) owns nothing
     */
    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && $this->owner_id === $user->id;
    }

    /**
     * Only the exercises this user may see: the public ones and their own
     * (docs/design/D2-decisions.md D2.3). ExercisePolicy::view() says the same
     * for one exercise; this says it for a query, so the list never loads
     * someone else's personal exercises.
     *
     * A query scope. The #[Scope] attribute turns this protected method into
     * one that can be called on the model or on a query, without the
     * `$query` argument: `Exercise::visibleTo($user)`. Laravel passes the
     * query being built as the first argument; the method adds conditions to
     * it and returns nothing.
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  User  $user  the signed-in user
     */
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        // The two conditions are wrapped in a function, which Laravel writes
        // as a parenthesis: `(owner_id is null or owner_id = 5)`. Without it,
        // the OR would mix with the conditions added after this scope
        $query->where(fn (Builder $q) => $q
            ->whereNull('owner_id')
            ->orWhere('owner_id', $user->id));
    }

    /**
     * Searches the name and the aliases, as the user reads them
     * (docs/design/D3-data-model.md D3.4.6): in the request's language, or in
     * English when the exercise has no text in that language. Upper and lower
     * case do not matter.
     *
     * The SQL, for a user who reads Italian:
     * `coalesce(name->>'it', name->>'en') ilike '%panca%'`. `->>` reads one
     * key of a JSON column as text; coalesce() gives the first value that is
     * not null; ilike is Postgres's case-insensitive LIKE, and `%` matches
     * any text. The `?` are placeholders, filled by the database driver with
     * the values in the array, so whatever the user types is never read as
     * SQL ("SQL injection").
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  string  $term  what the user typed
     */
    #[Scope]
    protected function search(Builder $query, string $term): void
    {
        // The current language, set from the request by SetLocaleFromRequest
        $locale = app()->getLocale();
        // The text to find anywhere: `%` around it. A `%` or `_` typed by the
        // user is escaped with a backslash, so it is looked for as itself
        // rather than meaning "anything"
        $pattern = '%'.addcslashes(trim($term), '\\%_').'%';

        $query->where(fn (Builder $q) => $q
            ->whereRaw("coalesce(name->>?, name->>'en') ilike ?", [$locale, $pattern])
            ->orWhereRaw("coalesce(aliases->>?, aliases->>'en') ilike ?", [$locale, $pattern]));
    }

    /**
     * The exercises whose primary muscles include one of these, by slug:
     * `withPrimaryMuscle('chest', 'triceps')`. Secondary muscles do not count,
     * so filtering by chest shows the bench press but not the triceps dip.
     *
     * `string ...$slugs` takes any number of arguments as one array. The
     * list's filter `filter[muscle]=chest,triceps` arrives here as two.
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  string  ...$slugs  the muscles' slugs
     */
    #[Scope]
    protected function withPrimaryMuscle(Builder $query, string ...$slugs): void
    {
        // whereHas(): only exercises with at least one related row that
        // matches. It becomes an `exists (select … from muscles inner join
        // exercise_muscle …)` subquery, so the pivot's column is there,
        // written with its table's name
        $query->whereHas('muscles', fn (Builder $q) => $q
            ->whereIn('slug', $slugs)
            ->where('exercise_muscle.role', MuscleRole::Primary));
    }

    /**
     * The exercises that use one of these kinds of equipment, by slug.
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  string  ...$slugs  the equipment's slugs
     */
    #[Scope]
    protected function usingEquipment(Builder $query, string ...$slugs): void
    {
        $query->whereHas('equipment', fn (Builder $q) => $q->whereIn('slug', $slugs));
    }

    /**
     * Only public exercises (`public`) or only personal ones (`mine`), the
     * Source filter of the library (docs/design/D1-ui.md D1.4.3).
     *
     * "Personal" is enough to mean "mine" because the list is already
     * limited by visibleTo(). ListExercisesRequest accepts only these two
     * values, so `default` never runs from the API.
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  string  $source  `mine` or `public`
     */
    #[Scope]
    protected function fromSource(Builder $query, string $source): void
    {
        // match: like switch, but an expression, with strict comparison
        match ($source) {
            'public' => $query->whereNull('owner_id'),
            'mine' => $query->whereNotNull('owner_id'),
            default => null,
        };
    }

    /**
     * Sorts by name, in the request's language (English when missing), the
     * way a person expects: upper and lower case and accents together.
     *
     * `collate "und-x-icu"` asks Postgres for the ICU rules of no language in
     * particular. The database's own rules, on the Alpine image, compare the
     * bytes: "Bench" before "banca", "Cuello" before "Cuádriceps"
     * (docs/how-to/H2-backend.md H2.12). The id comes last, so two exercises
     * with the same name keep the same order from one page to the next.
     *
     * @param  Builder<Exercise>  $query  the query being built
     */
    #[Scope]
    protected function orderByName(Builder $query): void
    {
        $query->orderByRaw("coalesce(name->>?, name->>'en') collate \"und-x-icu\"", [app()->getLocale()])
            ->orderBy('id');
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
