<?php

/**
 * The admin panel's own texts, in German: the same keys as
 * lang/en/admin.php, which explains the file.
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
        'weight_reps' => 'Gewicht und Wiederholungen',
        'reps' => 'Wiederholungen',
        'time' => 'Zeit',
        'distance' => 'Strecke',
    ],

    'google' => [
        'continue' => 'Weiter mit Google',
        'or' => 'oder',
        'errors' => [
            'cancelled' => 'Die Anmeldung mit Google wurde abgebrochen. Versuche es erneut oder nutze deine E-Mail.',
            'failed' => 'Die Anmeldung mit Google hat nicht geklappt. Versuche es gleich noch einmal.',
            'unverified' => 'Google hat diese E-Mail-Adresse nicht bestätigt, daher kann sie nicht zur Anmeldung verwendet werden.',
            'disabled' => 'Dieses Konto wurde deaktiviert.',
        ],
    ],

    'exercises' => [
        'label' => 'Übung',
        'plural_label' => 'Übungen',
        'navigation' => 'Übungsbibliothek',
        // Table
        'photo' => 'Foto',
        'name' => 'Name',
        'equipment' => 'Ausrüstung',
        'primary_muscles' => 'Hauptmuskeln',
        'secondary_muscles' => 'Nebenmuskeln',
        'logging_type' => 'Erfasst als',
        'to_review' => 'Zu prüfen',
        'source' => 'Herkunft',
        'sources' => [
            'free_exercise_db' => 'free-exercise-db',
            'extra' => 'AtleoPlan-Extra',
            'panel' => 'Admin-Bereich',
        ],
        'updated_at' => 'Geändert',
        'to_review_in' => 'Zu prüfen auf',
        // Form
        'texts' => 'Texte',
        'texts_help' => 'Englisch ist das Original. Eine leer gelassene Sprache wird entfernt; die App zeigt dann Englisch.',
        'aliases' => 'Weitere Namen',
        'aliases_help' => 'Namen, unter denen man sie sucht. Nach jedem Enter drücken.',
        'description' => 'Beschreibung',
        'instructions' => 'Schritte',
        'add_step' => 'Schritt hinzufügen',
        'reviewed' => 'Von einem Menschen geprüft',
        'reviewed_help' => 'Aus: maschinell übersetzt, noch zu prüfen.',
        'english_original' => 'Englisches Original',
        'details' => 'Übung',
        'youtube_url' => 'YouTube-Video',
        'source_details' => 'Herkunft',
        'external_id' => 'Importiert als :id',
        'created_in_panel' => 'Im Admin-Bereich erstellt.',
        'photos' => '{0} Keine Fotos.|{1} 1 Foto.|[2,*] :count Fotos.',
        'photos_help' => 'Fotos und Videos werden in einer späteren Version dieser Seite verwaltet.',
    ],

    'users' => [
        'label' => 'Benutzer',
        'plural_label' => 'Benutzer',
        'navigation' => 'Benutzer',
        // Table
        'name' => 'Name',
        'email' => 'E-Mail',
        'role' => 'Rolle',
        'roles' => [
            'admin' => 'Admin',
            'user' => 'Benutzer',
        ],
        'google' => 'Google',
        'status' => 'Status',
        'statuses' => [
            'active' => 'Aktiv',
            'disabled' => 'Deaktiviert',
        ],
        'created_at' => 'Registriert',
        'you' => 'Du',
        // Actions
        'make_admin' => 'Zum Admin machen',
        'make_admin_confirm' => ':name kann diesen Bereich öffnen und die öffentliche Bibliothek und die Benutzer ändern.',
        'remove_admin' => 'Admin entziehen',
        'remove_admin_confirm' => ':name kann diesen Bereich nicht mehr öffnen.',
        'disable' => 'Deaktivieren',
        'disable_confirm' => ':name wird sofort abgemeldet und kann sich nicht mehr anmelden, weder mit Passwort noch mit Google. Pläne und Trainings bleiben erhalten.',
        'enable' => 'Aktivieren',
        'enable_confirm' => ':name kann sich wieder anmelden.',
        'done' => 'Gespeichert.',
    ],
];
