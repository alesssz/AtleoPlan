<?php

namespace App\Filament\Resources\Exercises\Schemas;

// Imports: the photos' action (for its limit), our enums and models, then Filament's form fields
// (Filament\Forms\Components) and layout pieces (Filament\Schemas\Components),
// and Laravel's HtmlString for text that is already HTML
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
 * The form of a public exercise, on the create and edit pages
 * (docs/design/D1-ui.md D1.4.15, docs/concepts/C2-backend.md C2.8.2).
 *
 * A Filament **schema** is a list of components, written in PHP, that
 * Filament draws as the page: fields (TextInput, Select…) hold values,
 * layout pieces (Tabs, Section, Group) arrange them. Each field's name is
 * where its value goes in the form's **state**, the array the page saves.
 *
 * Three parts:
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
    /**
     * Puts the components into the form. `static`: Filament calls
     * `ExerciseForm::configure($schema)` from the resource, with no object.
     *
     * @param  Schema  $schema  an empty form, handed in by Filament
     * @return Schema the same form, filled
     */
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                // Texts: one tab per language, English first.
                // array_map() turns each code into its tab
                Tabs::make(__('admin.exercises.texts'))
                    ->tabs(array_map(fn (string $locale) => self::languageTab($locale), Locale::codes()))
                    // The form is a grid of two columns; this takes both
                    ->columnSpanFull(),

                // The exercise's own data, the same in every language
                Section::make(__('admin.exercises.details'))
                    ->schema([
                        // A select's options: [value saved => label shown]
                        Select::make('logging_type')
                            ->label(__('admin.exercises.logging_type'))
                            ->options(self::loggingTypeOptions())
                            ->default(LoggingType::WeightReps->value)
                            ->required(),
                        // Options as a closure: read from the database when the
                        // form is drawn, in the admin's language
                        Select::make('equipment_id')
                            ->label(__('admin.exercises.equipment'))
                            ->options(fn () => Equipment::all()->sortBy('name')->pluck('name', 'id')->all()),
                        // multiple(): a list of ids. A muscle chosen in both
                        // lists stays primary (SavePublicExercise)
                        Select::make('primary_muscles')
                            ->label(__('admin.exercises.primary_muscles'))
                            ->multiple()
                            ->options(fn () => self::muscleOptions()),
                        Select::make('secondary_muscles')
                            ->label(__('admin.exercises.secondary_muscles'))
                            ->multiple()
                            ->options(fn () => self::muscleOptions()),
                        // url(): refused unless it is a web address
                        TextInput::make('youtube_url')
                            ->label(__('admin.exercises.youtube_url'))
                            ->url()
                            ->maxLength(255),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                // The photos: upload, drag into order, remove
                // (docs/concepts/C2-backend.md C2.8.2, D2.5)
                Section::make(__('admin.exercises.photos'))
                    ->schema([
                        // The field of the plugin filament/spatie-laravel-media-library-plugin:
                        // it reads and writes the exercise's `photos` collection
                        // of medialibrary itself, so the files never pass
                        // through SavePublicExercise. Filament saves it after
                        // the exercise, on the create page too (saveRelationships()).
                        // The same limits as the app's upload
                        // (StoreExercisePhotoRequest): 5 photos, 10 MB,
                        // JPEG, PNG or WebP. maxSize() is in kilobytes.
                        // conversion('thumb'): the previews show the 400 px
                        // copy, once the queue has made it
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

                // Where it came from: on the edit page only.
                // visibleOn('edit'): hidden on the create page, where there is no exercise yet
                Section::make(__('admin.exercises.source_details'))
                    ->schema([
                        // A closure's parameters are filled by Filament by
                        // their name: $record is the exercise of the page
                        Text::make(fn (?Exercise $record) => $record?->external_id !== null
                            ? __('admin.exercises.external_id', ['id' => $record->external_id])
                            : __('admin.exercises.created_in_panel')),
                    ])
                    ->visibleOn('edit')
                    ->columnSpanFull(),
            ]);
    }

    /**
     * The tab of one language: its name, other names, description and
     * steps; for every language but English, the review switch and the
     * English original.
     *
     * @param  string  $locale  the language's code, such as "it"
     */
    private static function languageTab(string $locale): Tab
    {
        // English is the original: its name is required, it has no switch
        $isEnglish = $locale === Locale::En->value;

        return Tab::make(__("admin.languages.{$locale}"))
            ->schema([
                // statePath(): the fields below write under translations.<locale>
                Group::make([
                    TextInput::make('name')
                        ->label(__('admin.exercises.name'))
                        ->required($isEnglish)
                        ->maxLength(255),
                    // A field of tags: each value typed, then Enter
                    TagsInput::make('aliases')
                        ->label(__('admin.exercises.aliases'))
                        ->helperText(__('admin.exercises.aliases_help')),
                    Textarea::make('description')
                        ->label(__('admin.exercises.description'))
                        ->rows(3),
                    // A repeater: a list of items, added, removed and dragged
                    // into order. simple(): each item is one field, so the
                    // state is a plain list of texts rather than of arrays
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

                // The English original, to compare a translation with, folded
                // until opened. Only on the edit page: a new exercise has none
                Section::make(__('admin.exercises.english_original'))
                    ->schema([
                        Html::make(fn (?Exercise $record) => self::englishOriginal($record)),
                    ])
                    ->collapsed()
                    ->visible(fn (?Exercise $record) => ! $isEnglish && $record !== null),
            ]);
    }

    /**
     * The English name and steps of an exercise as HTML: the name in bold,
     * the steps as a numbered list.
     *
     * e() escapes a text for HTML ("<" becomes "&lt;"), so a step can never
     * add markup to the page. HtmlString marks the result as HTML already,
     * so Filament prints it as it is instead of escaping it again.
     *
     * @param  Exercise|null  $exercise  the exercise of the page
     */
    private static function englishOriginal(?Exercise $exercise): HtmlString
    {
        // The English name. getTranslation(…, false): English only, with no
        // fallback to another language; '' when there is none
        $name = $exercise?->getTranslation('name', 'en', false) ?? '';
        // The English steps; an empty list when there are none
        $steps = $exercise?->getTranslation('instructions', 'en', false) ?: [];

        // One <li> per step, joined into one string
        $items = implode('', array_map(fn (string $step) => '<li>'.e($step).'</li>', $steps));

        return new HtmlString('<p><strong>'.e($name).'</strong></p><ol class="list-decimal ps-5">'.$items.'</ol>');
    }

    /**
     * The logging types as options, labelled in the admin's language.
     *
     * @return array<string, string> ['weight_reps' => 'Weight and reps', …]
     */
    public static function loggingTypeOptions(): array
    {
        return collect(LoggingType::cases())
            ->mapWithKeys(fn (LoggingType $type) => [$type->value => __("admin.logging_types.{$type->value}")])
            ->all();
    }

    /**
     * The 17 muscles as options, by name in the admin's language.
     *
     * pluck('name', 'id') gives [id => name]; `name` is translatable, so each
     * is in the current language (docs/design/D3-data-model.md D3.4.5).
     *
     * @return array<int, string>
     */
    private static function muscleOptions(): array
    {
        return Muscle::all()->sortBy('name')->pluck('name', 'id')->all();
    }
}
