<?php

namespace App\Filament\Resources\Exercises\Tables;

// Imports: the form (for its options), our enums and models, then
// Filament's actions, columns and filters, and Laravel's query builder
use App\Enums\Locale;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Filament\Resources\Exercises\Schemas\ExerciseForm;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\RestoreAction;
use Filament\Actions\RestoreBulkAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TrashedFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * The list of public exercises: columns, search, filters, actions
 * (docs/design/D1-ui.md D1.4.15, docs/concepts/C2-backend.md C2.8.2).
 *
 * A Filament **table** is described like the form: a list of columns, each
 * reading one value of the row (`TextColumn::make('logging_type')` reads
 * `$exercise->logging_type`), or computing it with `state()`. Filament adds
 * the paging, the search box and the filter panel by itself.
 *
 * The search and the order reuse the model's scopes, so the panel finds
 * what the app's library finds: "panca" finds "Panca piana" in every
 * language and the aliases ("Exercise::search()", docs/design/D3-data-model.md
 * D3.4.6), and names sort as a person expects (orderByName()).
 */
class ExercisesTable
{
    /**
     * Puts the columns, filters and actions into the table.
     *
     * @param  Table  $table  an empty table, handed in by Filament
     * @return Table the same table, filled
     */
    public static function configure(Table $table): Table
    {
        return $table
            // Loads the relations each row shows in three queries in all,
            // not three per row (the "N+1" problem, docs/concepts/C2-backend.md C2.6)
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['equipment', 'muscles', 'media']))
            // By name, in the admin's language, until a column is clicked
            ->defaultSort(fn (Builder $query) => $query->orderByName())
            ->columns([
                // The first photo, small; none for an exercise without photos
                ImageColumn::make('photo')
                    ->label(__('admin.exercises.photo'))
                    ->state(fn (Exercise $record) => self::photoUrl($record))
                    ->imageHeight(40),
                // The name; the search box searches through it with the
                // model's scope instead of a plain LIKE on the column
                TextColumn::make('name')
                    ->label(__('admin.exercises.name'))
                    ->searchable(query: fn (Builder $query, string $search) => $query->search($search))
                    ->weight('bold'),
                // A relation's column: equipment.name reads $exercise->equipment->name
                TextColumn::make('equipment.name')
                    ->label(__('admin.exercises.equipment')),
                // A list as state: one badge per primary muscle
                TextColumn::make('primary_muscles')
                    ->label(__('admin.exercises.primary_muscles'))
                    ->state(fn (Exercise $record) => $record->muscles
                        ->filter(fn (Muscle $muscle) => $muscle->pivot->role === MuscleRole::Primary)
                        ->pluck('name')
                        ->all())
                    ->badge(),
                // The enum, written in words. formatStateUsing() changes what
                // is shown, not the value
                TextColumn::make('logging_type')
                    ->label(__('admin.exercises.logging_type'))
                    ->formatStateUsing(fn (LoggingType $state) => __("admin.logging_types.{$state->value}"))
                    ->badge()
                    ->color('gray'),
                // The languages not yet reviewed, as amber badges: "IT", "ES"
                TextColumn::make('machine_translated')
                    ->label(__('admin.exercises.to_review'))
                    ->formatStateUsing(fn (string $state) => strtoupper($state))
                    ->badge()
                    ->color('warning'),
                // Where the exercise came from; hidden until switched on in
                // the columns menu
                TextColumn::make('source')
                    ->label(__('admin.exercises.source'))
                    ->state(fn (Exercise $record) => __('admin.exercises.sources.'.self::sourceOf($record)))
                    ->toggleable(isToggledHiddenByDefault: true),
                // since(): "3 hours ago", in the admin's language
                TextColumn::make('updated_at')
                    ->label(__('admin.exercises.updated_at'))
                    ->since()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                // Each SelectFilter shows a list; query() says what choosing
                // a value does to the query. $data['value'] is the choice,
                // empty when the filter is cleared; filled(), a Laravel
                // helper, is true for a value that is not null, '' or [].
                // Without query(), the filter compares the column of its
                // name with the value, as equipment_id and logging_type do
                SelectFilter::make('equipment_id')
                    ->label(__('admin.exercises.equipment'))
                    ->options(fn () => Equipment::all()->sortBy('name')->pluck('name', 'id')->all()),
                SelectFilter::make('primary_muscle')
                    ->label(__('admin.exercises.primary_muscles'))
                    ->options(fn () => Muscle::all()->sortBy('name')->pluck('name', 'slug')->all())
                    ->query(fn (Builder $query, array $data) => filled($data['value'])
                        ? $query->withPrimaryMuscle($data['value'])
                        : $query),
                SelectFilter::make('logging_type')
                    ->label(__('admin.exercises.logging_type'))
                    ->options(ExerciseForm::loggingTypeOptions()),
                // The exercises whose Italian (say) is still machine translated.
                // whereJsonContains(): the JSON list in the column holds this value
                SelectFilter::make('to_review_in')
                    ->label(__('admin.exercises.to_review_in'))
                    ->options(fn () => collect(Locale::codes())
                        ->reject(fn (string $locale) => $locale === Locale::En->value)
                        ->mapWithKeys(fn (string $locale) => [$locale => __("admin.languages.{$locale}")])
                        ->all())
                    ->query(fn (Builder $query, array $data) => filled($data['value'])
                        ? $query->whereJsonContains('machine_translated', $data['value'])
                        : $query),
                SelectFilter::make('source')
                    ->label(__('admin.exercises.source'))
                    ->options(fn () => collect(['free_exercise_db', 'extra', 'panel'])
                        ->mapWithKeys(fn (string $source) => [$source => __("admin.exercises.sources.{$source}")])
                        ->all())
                    // match: like switch, but an expression with strict
                    // comparison, whose arm gives the value; `default` for the rest
                    ->query(fn (Builder $query, array $data) => match ($data['value'] ?? null) {
                        // `\_`: an underscore itself; alone, in LIKE, it means "any one character"
                        'free_exercise_db' => $query->whereNotNull('external_id')->where('external_id', 'not like', 'AtleoPlan\_%'),
                        'extra' => $query->where('external_id', 'like', 'AtleoPlan\_%'),
                        'panel' => $query->whereNull('external_id'),
                        default => $query,
                    }),
                // Without, with or only the deleted exercises: generated by --soft-deletes
                TrashedFilter::make(),
            ])
            // The buttons of each row: Edit, and Restore on a deleted one
            ->recordActions([
                EditAction::make(),
                RestoreAction::make(),
            ])
            // The actions on the rows ticked: delete (soft) and restore. The
            // generated Force delete was removed (ExerciseResource)
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }

    /**
     * The address of the exercise's first photo, or null: its 400 px
     * thumbnail once the queue has made it, the original until then.
     *
     * medialibrary builds a full URL from APP_URL, which inside the container
     * is localhost:8000, while the browser opens the panel at localhost:8500.
     * Only the path is kept (as App\Http\Resources\ExerciseResource does),
     * then url() puts in front the address of the request being answered:
     * the right one, whatever it is.
     *
     * @param  Exercise  $exercise  the row
     */
    private static function photoUrl(Exercise $exercise): ?string
    {
        // The first photo of the collection, or null when there is none
        $photo = $exercise->getFirstMedia('photos');

        if ($photo === null) {
            return null;
        }

        // The thumbnail's URL when it exists (Exercise::registerMediaConversions())
        $full = $photo->hasGeneratedConversion('thumb') ? $photo->getUrl('thumb') : $photo->getUrl();

        return url((string) parse_url($full, PHP_URL_PATH));
    }

    /**
     * Where an exercise came from, as a key of admin.exercises.sources.
     *
     * @param  Exercise  $exercise  the row
     * @return string free_exercise_db, extra (ours, AtleoPlan_…) or panel (no external id)
     */
    private static function sourceOf(Exercise $exercise): string
    {
        return match (true) {
            $exercise->external_id === null => 'panel',
            str_starts_with($exercise->external_id, 'AtleoPlan_') => 'extra',
            default => 'free_exercise_db',
        };
    }
}
