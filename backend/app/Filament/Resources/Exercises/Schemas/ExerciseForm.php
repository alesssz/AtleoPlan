<?php

namespace App\Filament\Resources\Exercises\Schemas;

use App\Actions\Exercises\ExercisePhotos;
use App\Enums\Locale;
use App\Enums\LoggingType;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Html;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Text;
use Filament\Schemas\Schema;
use Illuminate\Support\HtmlString;

/**
 * The form of a public exercise, on the create and edit pages:
 * - **Texts, one tab per language.** Each tab's fields sit in a Group with
 *   `statePath('translations.it')`, so the Italian name lands in
 *   `translations.it.name`: the shape SavePublicExercise takes. Every tab
 *   but English has a "Reviewed by a person" switch and, on the edit page,
 *   the English original to compare with.
 * - **Exercise:** logging type, equipment, primary and secondary muscles, video.
 * - **Photos:** upload, order, remove, with the medialibrary plugin's field.
 * - **Source** (edit page only): where the exercise came from.
 */
class ExerciseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make(__('admin.exercises.texts'))
                    ->tabs(array_map(fn (string $locale) => self::languageTab($locale), Locale::codes()))
                    ->columnSpanFull(),

                Section::make(__('admin.exercises.details'))
                    ->schema([
                        Select::make('logging_type')
                            ->label(__('admin.exercises.logging_type'))
                            ->options(self::loggingTypeOptions())
                            ->default(LoggingType::WeightReps->value)
                            ->required(),
                        // A closure, so the names are read in the admin's language
                        Select::make('equipment_id')
                            ->label(__('admin.exercises.equipment'))
                            ->options(fn () => Equipment::all()->sortBy('name')->pluck('name', 'id')->all()),
                        // A muscle chosen in both lists stays primary
                        // (SavePublicExercise)
                        Select::make('primary_muscles')
                            ->label(__('admin.exercises.primary_muscles'))
                            ->multiple()
                            ->options(fn () => self::muscleOptions()),
                        Select::make('secondary_muscles')
                            ->label(__('admin.exercises.secondary_muscles'))
                            ->multiple()
                            ->options(fn () => self::muscleOptions()),
                        TextInput::make('youtube_url')
                            ->label(__('admin.exercises.youtube_url'))
                            ->url()
                            ->maxLength(255),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                Section::make(__('admin.exercises.photos'))
                    ->schema([
                        // Reads and writes the `photos` collection itself, so
                        // the files never pass through SavePublicExercise;
                        // Filament saves it after the exercise. The same limits
                        // as the app's upload (StoreExercisePhotoRequest)
                        SpatieMediaLibraryFileUpload::make('photos')
                            ->hiddenLabel()
                            ->collection('photos')
                            ->multiple()
                            ->reorderable()
                            ->maxFiles(ExercisePhotos::MAX)
                            ->image()
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                            ->maxSize(10 * 1024)
                            ->conversion('thumb')
                            ->panelLayout('grid')
                            ->helperText(__('admin.exercises.photos_help')),
                    ])
                    ->columnSpanFull(),

                Section::make(__('admin.exercises.source_details'))
                    ->schema([
                        Text::make(fn (?Exercise $record) => $record?->external_id !== null
                            ? __('admin.exercises.external_id', ['id' => $record->external_id])
                            : __('admin.exercises.created_in_panel')),
                    ])
                    ->visibleOn('edit')
                    ->columnSpanFull(),
            ]);
    }

    /**
     * Every language but English has the review switch and the English
     * original to compare with.
     */
    private static function languageTab(string $locale): Tab
    {
        // English is the original: its name is required, it has no switch
        $isEnglish = $locale === Locale::En->value;

        return Tab::make(__("admin.languages.{$locale}"))
            ->schema([
                Group::make([
                    TextInput::make('name')
                        ->label(__('admin.exercises.name'))
                        ->required($isEnglish)
                        ->maxLength(255),
                    TagsInput::make('aliases')
                        ->label(__('admin.exercises.aliases'))
                        ->helperText(__('admin.exercises.aliases_help')),
                    Textarea::make('description')
                        ->label(__('admin.exercises.description'))
                        ->rows(3),
                    // simple(): the state is a list of texts, not of arrays
                    Repeater::make('instructions')
                        ->label(__('admin.exercises.instructions'))
                        ->simple(Textarea::make('step')->rows(2)->required())
                        ->addActionLabel(__('admin.exercises.add_step'))
                        ->defaultItems(0)
                        ->reorderable(),
                    Toggle::make('reviewed')
                        ->label(__('admin.exercises.reviewed'))
                        ->helperText(__('admin.exercises.reviewed_help'))
                        // A new exercise is written by the admin: reviewed
                        ->default(true)
                        ->visible(! $isEnglish),
                ])->statePath("translations.{$locale}"),

                // A new exercise has no original yet
                Section::make(__('admin.exercises.english_original'))
                    ->schema([
                        Html::make(fn (?Exercise $record) => self::englishOriginal($record)),
                    ])
                    ->collapsed()
                    ->visible(fn (?Exercise $record) => ! $isEnglish && $record !== null),
            ]);
    }

    /**
     * Every text is escaped, so a step can never add markup to the page.
     */
    private static function englishOriginal(?Exercise $exercise): HtmlString
    {
        $name = $exercise?->getTranslation('name', 'en', false) ?? '';
        $steps = $exercise?->getTranslation('instructions', 'en', false) ?: [];

        $items = implode('', array_map(fn (string $step) => '<li>'.e($step).'</li>', $steps));

        return new HtmlString('<p><strong>'.e($name).'</strong></p><ol class="list-decimal ps-5">'.$items.'</ol>');
    }

    /**
     * @return array<string, string> ['weight_reps' => 'Weight and reps', …]
     */
    public static function loggingTypeOptions(): array
    {
        return collect(LoggingType::cases())
            ->mapWithKeys(fn (LoggingType $type) => [$type->value => __("admin.logging_types.{$type->value}")])
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private static function muscleOptions(): array
    {
        return Muscle::all()->sortBy('name')->pluck('name', 'id')->all();
    }
}
