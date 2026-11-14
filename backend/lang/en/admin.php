<?php

/**
 * The admin panel's own texts; Filament's built-in ones come translated with
 * the package. The panel follows the admin's `users.locale`, so the four
 * languages share these keys.
 */
return [
    // The languages, each written in itself: the tabs of the exercise form
    'languages' => [
        'en' => 'English',
        'it' => 'Italiano',
        'es' => 'Español',
        'de' => 'Deutsch',
    ],

    // How an exercise's sets are logged (App\Enums\LoggingType)
    'logging_types' => [
        'weight_reps' => 'Weight and reps',
        'reps' => 'Reps',
        'time' => 'Time',
        'distance' => 'Distance',
    ],

    // "Continue with Google" under the login form (resources/views/filament/google-sign-in.blade.php);
    // the same texts as the React app's sign-in page
    'google' => [
        'continue' => 'Continue with Google',
        'or' => 'or',
        'errors' => [
            'cancelled' => 'Signing in with Google was cancelled. Try again, or use your email.',
            'failed' => 'Signing in with Google didn\'t work. Please try again in a moment.',
            'unverified' => 'Google hasn\'t verified this email address, so it can\'t be used to sign in.',
            'disabled' => 'This account has been disabled.',
        ],
    ],

    'exercises' => [
        'label' => 'exercise',
        'plural_label' => 'exercises',
        'navigation' => 'Exercise library',
        // Table
        'photo' => 'Photo',
        'name' => 'Name',
        'equipment' => 'Equipment',
        'primary_muscles' => 'Primary muscles',
        'secondary_muscles' => 'Secondary muscles',
        'logging_type' => 'Logged as',
        'to_review' => 'To review',
        'source' => 'Source',
        'sources' => [
            'free_exercise_db' => 'free-exercise-db',
            'extra' => 'AtleoPlan extra',
            'panel' => 'Admin panel',
        ],
        'updated_at' => 'Changed',
        'to_review_in' => 'To review in',
        // Form
        'texts' => 'Texts',
        'texts_help' => 'English is the original. A language left empty is removed; the app then shows English.',
        'aliases' => 'Other names',
        'aliases_help' => 'Names people search for. Press Enter after each.',
        'description' => 'Description',
        'instructions' => 'Steps',
        'add_step' => 'Add a step',
        'reviewed' => 'Reviewed by a person',
        'reviewed_help' => 'Off: machine translated, still to be checked.',
        'english_original' => 'English original',
        'details' => 'Exercise',
        'youtube_url' => 'YouTube video',
        'source_details' => 'Source',
        'external_id' => 'Imported as :id',
        'created_in_panel' => 'Created in the admin panel.',
        'photos' => 'Photos',
        'photos_help' => 'Up to 5, JPEG, PNG or WebP, 10 MB each. Drag to change the order: the first is the cover.',
    ],

    'users' => [
        'label' => 'user',
        'plural_label' => 'users',
        'navigation' => 'Users',
        // Table
        'name' => 'Name',
        'email' => 'Email',
        'role' => 'Role',
        'roles' => [
            'admin' => 'Admin',
            'user' => 'User',
        ],
        'google' => 'Google',
        'status' => 'Status',
        'statuses' => [
            'active' => 'Active',
            'disabled' => 'Disabled',
        ],
        'created_at' => 'Signed up',
        'you' => 'You',
        // Actions
        'make_admin' => 'Make admin',
        'make_admin_confirm' => ':name will be able to open this panel and change the public library and the users.',
        'remove_admin' => 'Remove admin',
        'remove_admin_confirm' => ':name will no longer be able to open this panel.',
        'disable' => 'Disable',
        'disable_confirm' => ':name is signed out at once and can no longer sign in, with a password or with Google. Their plans and workouts are kept.',
        'enable' => 'Enable',
        'enable_confirm' => ':name will be able to sign in again.',
        'done' => 'Saved.',
    ],
];
