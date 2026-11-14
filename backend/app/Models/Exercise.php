<?php

namespace App\Models;

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
 * An exercise of the library.
 *
 * Public when owner_id is null (seen by everyone, managed by admins, filled by
 * the free-exercise-db import), personal otherwise (seen and edited only by its
 * owner).
 *
 * - Translated columns fall back to English, then to any language there is (set
 *   in AppServiceProvider).
 * - Soft-deleted, so plans and history that point to an exercise keep working.
 * - Photos and videos are medialibrary collections.
 *
 * owner_id is set through `$user->exercises()`, so no request can give an
 * exercise to someone else. external_id, level, category and
 * machine_translated belong to the import, which writes them directly.
 */
#[Fillable(['name', 'aliases', 'description', 'instructions', 'logging_type', 'equipment_id', 'youtube_url'])]
class Exercise extends Model implements HasMedia
{
    /** @use HasFactory<ExerciseFactory> */
    use HasFactory, HasTranslations, InteractsWithMedia, SoftDeletes;

    /**
     * aliases and instructions hold a list per language.
     *
     * @var list<string>
     */
    public array $translatable = ['name', 'aliases', 'description', 'instructions'];

    /**
     * machine_translated lists the languages filled by machine translation,
     * such as ['es', 'de'].
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
     * The shortest word search() also matches written as two (rule C):
     * "pullup" finds "pull up", while "dip" must not find "di petto".
     */
    private const MIN_JOINED_LETTERS = 5;

    /**
     * The table's defaults, which a new model does not read back.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'logging_type' => 'weight_reps',
        'machine_translated' => '[]',
    ];

    /**
     * search_text is rebuilt on every save, whoever saves: the API, the
     * import, the translation, the admin panel, a factory. Writes that bypass
     * the model (DB::table()->update()) must fill it themselves, as the
     * migration that added the column does.
     */
    protected static function booted(): void
    {
        static::saving(function (Exercise $exercise) {
            $exercise->search_text = SearchText::forExercise(
                $exercise->getTranslations('name'),
                $exercise->getTranslations('aliases'),
            );
        });
    }

    /**
     * Null for a public exercise.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return BelongsTo<Equipment, $this>
     */
    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    /**
     * Each muscle carries `pivot->role`, cast by ExerciseMuscle.
     *
     * @return BelongsToMany<Muscle, $this, ExerciseMuscle>
     */
    public function muscles(): BelongsToMany
    {
        return $this->belongsToMany(Muscle::class)->using(ExerciseMuscle::class)->withPivot('role');
    }

    public function isPublic(): bool
    {
        return $this->owner_id === null;
    }

    public function isOwnedBy(?User $user): bool
    {
        return $user !== null && $this->owner_id === $user->id;
    }

    /**
     * The public exercises and the user's own: ExercisePolicy::view() as a
     * query, so a list never loads someone else's personal exercises.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        // Grouped, so the OR does not mix with the conditions added after
        $query->where(fn (Builder $q) => $q
            ->whereNull('owner_id')
            ->orWhere('owner_id', $user->id));
    }

    /**
     * Searches the name and the aliases in every language, ignoring case,
     * accents and dashes: "pull up" finds "Pullups" and "Band Assisted
     * Pull-Up", "trazioni" finds "Pullups" through its Italian name in any
     * interface, "squat jump" finds "Jump squat".
     *
     * The term is split into words normalised like search_text
     * (App\Support\SearchText). Matches start at a word of the column, never
     * inside one, so "up" does not find "supina". An exercise matches by any
     * of three rules:
     *
     * A. **The words, in any order:** each is a whole word of the text,
     *    except the last, which only has to start one (it may still be being
     *    typed). "squat jump" finds "freehand jump squat"; "trazioni al"
     *    finds "trazioni alla sbarra"; "pull up" does not find "low pulley".
     * B. **Several words typed as one:** "pull up" is "pullup", the start of
     *    "pullups".
     * C. **One word that the text writes as two:** "pullup" finds "pull up",
     *    the letters in order with optional spaces between them. Only from
     *    MIN_JOINED_LETTERS letters: a short word would match pieces of two.
     *
     * The SQL, for "pull up" (rules A and B; C applies to one word only):
     *
     *     concat(' ', search_text, ' ') like '% pull %' and concat(' ', search_text, ' ') like '% up%'
     *     or concat(' ', search_text, ' ') like '% pullup%'
     *
     * The padding makes "% pull %" mean "the word pull", first and last word
     * included. Rule C is a Postgres regex, `' p ?u ?l ?l ?u ?p'` for
     * "pullup"; normalised words hold only a-z and 0-9, so nothing in them
     * is special to LIKE or to a regex.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function search(Builder $query, string $term): void
    {
        $words = SearchText::words($term);

        // Only punctuation typed, such as "%"
        if ($words === []) {
            $query->whereRaw('false');

            return;
        }

        $padded = "concat(' ', search_text, ' ')";
        $last = array_pop($words);

        // Grouped, so the ORs do not mix with the other filters
        $query->where(function (Builder $any) use ($padded, $words, $last) {
            // A
            $any->where(function (Builder $every) use ($padded, $words, $last) {
                foreach ($words as $word) {
                    $every->whereRaw("{$padded} like ?", ["% {$word} %"]);
                }
                $every->whereRaw("{$padded} like ?", ["% {$last}%"]);
            });

            // B
            if ($words !== []) {
                $any->orWhereRaw("{$padded} like ?", ['% '.implode('', $words).$last.'%']);
            }

            // C
            if ($words === [] && strlen($last) >= self::MIN_JOINED_LETTERS) {
                $any->orWhereRaw("{$padded} ~ ?", [' '.implode(' ?', str_split($last))]);
            }
        });
    }

    /**
     * Exercises whose primary muscles include one of these slugs. Secondary
     * muscles do not count: filtering by chest shows the bench press but not
     * the triceps dip.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function withPrimaryMuscle(Builder $query, string ...$slugs): void
    {
        $query->whereHas('muscles', fn (Builder $q) => $q
            ->whereIn('slug', $slugs)
            ->where('exercise_muscle.role', MuscleRole::Primary));
    }

    /**
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function usingEquipment(Builder $query, string ...$slugs): void
    {
        $query->whereHas('equipment', fn (Builder $q) => $q->whereIn('slug', $slugs));
    }

    /**
     * The library's Source filter, `public` or `mine`. "Personal" means "mine"
     * because the list is already limited by visibleTo(); ListExercisesRequest
     * accepts only these two values.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function fromSource(Builder $query, string $source): void
    {
        match ($source) {
            'public' => $query->whereNull('owner_id'),
            'mine' => $query->whereNotNull('owner_id'),
            default => null,
        };
    }

    /**
     * By name in the request's language (English when missing), with case and
     * accents sorted together. The Alpine image's default collation compares
     * bytes ("Bench" before "banca"), hence ICU's root collation. The id keeps
     * equal names in a stable order across pages.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function orderByName(Builder $query): void
    {
        $query->orderByRaw("coalesce(name->>?, name->>'en') collate \"und-x-icu\"", [app()->getLocale()])
            ->orderBy('id');
    }

    /**
     * The photo and video collections. Count and size limits are checked by
     * StoreExercisePhotoRequest.
     */
    public function registerMediaCollections(): void
    {
        // The first photo is the cover. No HEIC: GD cannot read it, and an
        // iPhone's browser uploads a JPEG anyway
        $this->addMediaCollection('photos')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('videos')
            ->acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/webm']);
    }

    /**
     * Two WebP copies of each photo:
     *
     * - `thumb`, at most 400 px: the lists' 56 px squares and workout mode's
     *   80 px one, sharp on a dense phone screen;
     * - `large`, at most 1600 px: the exercise's page.
     *
     * Fit::Max never enlarges. The original is kept, so new sizes can be
     * regenerated (`media-library:regenerate`). Conversions run on the queue;
     * until they exist ExerciseResource sends the original.
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
