<?php

namespace App\Models;

// Imports: the enum of logging_type, the class that builds the search text,
// the attribute and traits used below, the types of the three relations, and
// the two packages' pieces (translations, photos and videos)
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Support\SearchText;
use Database\Factories\ExerciseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
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
     * The shortest word the search also looks for written as two words
     * (rule C of search()): "pullup" finds "pull up", while "dip" does not
     * find "di petto".
     */
    private const MIN_JOINED_LETTERS = 5;

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
     * Runs once, when the class is first used: registers what happens on the
     * model's events.
     *
     * Eloquent fires events around every write: `saving` before each insert
     * or update, `saved` after, `deleting`, and so on. static::saving()
     * registers a function for one of them; it receives the model about to
     * be written and may change it. Here it fills search_text from the name
     * and the aliases, so the column is right after every save whoever saves:
     * the API, the import, the translation, an admin screen, a factory in a
     * test (docs/concepts/C2-backend.md C2.6, "Model events").
     *
     * What does not go through the model, such as DB::table()->update(),
     * fires no event: the migration that added the column fills it by hand.
     */
    protected static function booted(): void
    {
        static::saving(function (Exercise $exercise) {
            // getTranslations(): every language of a translatable column, as
            // ['en' => 'Pullups', 'it' => 'Trazioni alla sbarra']
            $exercise->search_text = SearchText::forExercise(
                $exercise->getTranslations('name'),
                $exercise->getTranslations('aliases'),
            );
        });
    }

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
     * Searches the name and the aliases in every language
     * (docs/design/D3-data-model.md D3.4.6), ignoring case, accents and
     * dashes: "pull up" finds "Pullups" and "Band Assisted Pull-Up",
     * "trazioni" finds "Pullups" through its Italian name in any interface,
     * "squat jump" finds "Jump squat".
     *
     * What the user typed is cut into words, normalised as the column
     * search_text is (App\Support\SearchText). Matches are looked for at the
     * start of the column's words only, never inside them, so a short word
     * such as "up" does not find "supina". An exercise is found by any of
     * three rules:
     *
     * A. **The words, in any order:** each is a whole word of the text,
     *    except the last, which only has to start one (it may still be being
     *    typed). "squat jump" finds "freehand jump squat"; "trazioni al"
     *    finds "trazioni alla sbarra"; "pull up" does not find "low pulley".
     * B. **Several words typed as one:** "pull up" is "pullup", the start of
     *    "pullups".
     * C. **One word that the text writes as two:** "pullup" finds "pull up",
     *    the letters in order with spaces allowed between them. Only for a
     *    word of MIN_JOINED_LETTERS or more: a short one would match pieces
     *    of two words, as "dip" would "di petto".
     *
     * The SQL, for "pull up" (rules A and B; C applies to one word only):
     *
     *     concat(' ', search_text, ' ') like '% pull %' and concat(' ', search_text, ' ') like '% up%'
     *     or concat(' ', search_text, ' ') like '% pullup%'
     *
     * concat() puts a space at both ends, so every word, the first and the
     * last too, has spaces around it, and "% pull %" means "the word pull".
     * Rule C is a regular expression, Postgres's `~`: for "pullup",
     * `' p ?u ?l ?l ?u ?p'`, where " ?" is "a space or not". The words hold
     * only a-z and 0-9, which mean nothing special in a pattern, and the `?`
     * placeholders keep the text out of the SQL itself ("SQL injection").
     *
     * @param  Builder<Exercise>  $query  the query being built
     * @param  string  $term  what the user typed
     */
    #[Scope]
    protected function search(Builder $query, string $term): void
    {
        $words = SearchText::words($term);

        // Only punctuation typed, such as "%": nothing can match it
        if ($words === []) {
            $query->whereRaw('false');

            return;
        }

        // The column with a space at both ends, written once for the three rules
        $padded = "concat(' ', search_text, ' ')";
        // array_pop() takes the last word off the list: $words keeps the others
        $last = array_pop($words);

        // The three rules in one parenthesis, so their ORs do not mix with
        // the other filters' conditions
        $query->where(function (Builder $any) use ($padded, $words, $last) {
            // A. Every word but the last whole, the last at a word's start:
            // one condition per word, all required (where() after where() is AND)
            $any->where(function (Builder $every) use ($padded, $words, $last) {
                foreach ($words as $word) {
                    $every->whereRaw("{$padded} like ?", ["% {$word} %"]);
                }
                $every->whereRaw("{$padded} like ?", ["% {$last}%"]);
            });

            // B. Several words typed as one, at a word's start
            if ($words !== []) {
                $any->orWhereRaw("{$padded} like ?", ['% '.implode('', $words).$last.'%']);
            }

            // C. One long word, which the text may write as two
            if ($words === [] && strlen($last) >= self::MIN_JOINED_LETTERS) {
                // str_split(): the word's letters; joined by " ?", a space or not
                $any->orWhereRaw("{$padded} ~ ?", [' '.implode(' ?', str_split($last))]);
            }
        });
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
     * method itself. The limits on number and size are checked by the upload
     * endpoint (StoreExercisePhotoRequest); the videos' conversion comes in
     * phase 2.
     */
    public function registerMediaCollections(): void
    {
        // The photos, in the order chosen in the editor; the first is the
        // cover. No HEIC: GD, the image library of our Docker image, cannot
        // read it, and an iPhone's browser sends a JPEG anyway (D2.5)
        $this->addMediaCollection('photos')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        // The videos: mp4, mov (as iPhones record them) and webm
        $this->addMediaCollection('videos')
            ->acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/webm']);
    }

    /**
     * The conversions: smaller copies medialibrary makes of each photo
     * (docs/design/D2-decisions.md D2.5, docs/concepts/C2-backend.md C2.5.9).
     * medialibrary calls this method itself, for every file added.
     *
     * - `thumb`: at most 400 × 400 px, for the lists' 56 px squares and
     *   workout mode's 80 px one, sharp on a phone's dense screen;
     * - `large`: at most 1600 × 1600 px, for the exercise's page.
     *
     * Both WebP, about a third of a JPEG of the same quality. Fit::Max keeps
     * the photo's proportions and never enlarges it: a 850 px photo of
     * free-exercise-db gets a `large` of 850 px. The original stays on the
     * disk, so the conversions can be made again if their sizes change
     * (`php artisan media-library:regenerate`).
     *
     * The conversions are **queued**: a job of the `queue` container makes
     * them a moment after the upload (config media-library
     * `queue_conversions_by_default`). Until then ExerciseResource sends the
     * original in their place.
     *
     * @param  Media|null  $media  the file being added; medialibrary may pass null
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Max, 400, 400)
            ->format('webp')
            ->performOnCollections('photos');

        $this->addMediaConversion('large')
            ->fit(Fit::Max, 1600, 1600)
            ->format('webp')
            ->performOnCollections('photos');
    }
}
