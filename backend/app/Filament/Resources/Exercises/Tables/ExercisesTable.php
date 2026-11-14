<?php

namespace App\Filament\Resources\Exercises\Tables;

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
 * The list of public exercises. Search and order reuse the model's scopes, so
 * the panel finds what the app's library finds, in every language and through
 * the aliases.
 */
class ExercisesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['equipment', 'muscles', 'media']))
            ->defaultSort(fn (Builder $query) => $query->orderByName())
            ->columns([
                ImageColumn::make('photo')
                    ->label(__('admin.exercises.photo'))
                    ->state(fn (Exercise $record) => self::photoUrl($record))
                    ->imageHeight(40),
                TextColumn::make('name')
                    ->label(__('admin.exercises.name'))
                    ->searchable(query: fn (Builder $query, string $search) => $query->search($search))
                    ->weight('bold'),
                TextColumn::make('equipment.name')
                    ->label(__('admin.exercises.equipment')),
                TextColumn::make('primary_muscles')
                    ->label(__('admin.exercises.primary_muscles'))
                    ->state(fn (Exercise $record) => $record->muscles
                        ->filter(fn (Muscle $muscle) => $muscle->pivot->role === MuscleRole::Primary)
                        ->pluck('name')
                        ->all())
                    ->badge(),
                TextColumn::make('logging_type')
                    ->label(__('admin.exercises.logging_type'))
                    ->formatStateUsing(fn (LoggingType $state) => __("admin.logging_types.{$state->value}"))
                    ->badge()
                    ->color('gray'),
                // The languages not yet reviewed: "IT", "ES"
                TextColumn::make('machine_translated')
                    ->label(__('admin.exercises.to_review'))
                    ->formatStateUsing(fn (string $state) => strtoupper($state))
                    ->badge()
                    ->color('warning'),
                TextColumn::make('source')
                    ->label(__('admin.exercises.source'))
                    ->state(fn (Exercise $record) => __('admin.exercises.sources.'.self::sourceOf($record)))
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label(__('admin.exercises.updated_at'))
                    ->since()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
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
                // Exercises whose Italian, say, is still machine translated
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
                    ->query(fn (Builder $query, array $data) => match ($data['value'] ?? null) {
                        // Escaped: in LIKE, `_` alone means any one character
                        'free_exercise_db' => $query->whereNotNull('external_id')->where('external_id', 'not like', 'AtleoPlan\_%'),
                        'extra' => $query->where('external_id', 'like', 'AtleoPlan\_%'),
                        'panel' => $query->whereNull('external_id'),
                        default => $query,
                    }),
                TrashedFilter::make(),
            ])
            ->recordActions([
                EditAction::make(),
                RestoreAction::make(),
            ])
            // No force delete (ExerciseResource)
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    RestoreBulkAction::make(),
                ]),
            ]);
    }

    /**
     * The cover's thumbnail, or the original until the queue has made it.
     *
     * medialibrary builds URLs from APP_URL, which inside the container is
     * not the address the browser uses; the path is kept and joined to the
     * address of the request being answered (as ExercisePhotoResource::pathOf()).
     */
    private static function photoUrl(Exercise $exercise): ?string
    {
        $photo = $exercise->getFirstMedia('photos');

        if ($photo === null) {
            return null;
        }

        $full = $photo->hasGeneratedConversion('thumb') ? $photo->getUrl('thumb') : $photo->getUrl();

        return url((string) parse_url($full, PHP_URL_PATH));
    }

    /**
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
