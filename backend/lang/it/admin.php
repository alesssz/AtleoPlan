<?php

/**
 * The admin panel's own texts, in Italian: the same keys as
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
        'weight_reps' => 'Peso e ripetizioni',
        'reps' => 'Ripetizioni',
        'time' => 'Tempo',
        'distance' => 'Distanza',
    ],

    'google' => [
        'continue' => 'Continua con Google',
        'or' => 'oppure',
        'errors' => [
            'cancelled' => 'Accesso con Google annullato. Riprova, oppure usa la tua email.',
            'failed' => 'L\'accesso con Google non è riuscito. Riprova tra un momento.',
            'unverified' => 'Google non ha verificato questo indirizzo email, quindi non si può usare per accedere.',
            'disabled' => 'Questo account è stato disattivato.',
        ],
    ],

    'exercises' => [
        'label' => 'esercizio',
        'plural_label' => 'esercizi',
        'navigation' => 'Libreria esercizi',
        // Table
        'photo' => 'Foto',
        'name' => 'Nome',
        'equipment' => 'Attrezzatura',
        'primary_muscles' => 'Muscoli principali',
        'secondary_muscles' => 'Muscoli secondari',
        'logging_type' => 'Registrato come',
        'to_review' => 'Da rivedere',
        'source' => 'Origine',
        'sources' => [
            'free_exercise_db' => 'free-exercise-db',
            'extra' => 'Extra AtleoPlan',
            'panel' => 'Pannello admin',
        ],
        'updated_at' => 'Modificato',
        'to_review_in' => 'Da rivedere in',
        // Form
        'texts' => 'Testi',
        'texts_help' => 'L\'inglese è l\'originale. Una lingua lasciata vuota viene tolta; l\'app mostra allora l\'inglese.',
        'aliases' => 'Altri nomi',
        'aliases_help' => 'Nomi con cui le persone lo cercano. Premi Invio dopo ciascuno.',
        'description' => 'Descrizione',
        'instructions' => 'Passaggi',
        'add_step' => 'Aggiungi un passaggio',
        'reviewed' => 'Rivisto da una persona',
        'reviewed_help' => 'Spento: tradotto automaticamente, ancora da controllare.',
        'english_original' => 'Originale inglese',
        'details' => 'Esercizio',
        'youtube_url' => 'Video YouTube',
        'source_details' => 'Origine',
        'external_id' => 'Importato come :id',
        'created_in_panel' => 'Creato nel pannello admin.',
        'photos' => 'Foto',
        'photos_help' => 'Fino a 5, JPEG, PNG o WebP, 10 MB ciascuna. Trascinale per cambiare l\'ordine: la prima è la copertina.',
    ],

    'users' => [
        'label' => 'utente',
        'plural_label' => 'utenti',
        'navigation' => 'Utenti',
        // Table
        'name' => 'Nome',
        'email' => 'Email',
        'role' => 'Ruolo',
        'roles' => [
            'admin' => 'Admin',
            'user' => 'Utente',
        ],
        'google' => 'Google',
        'status' => 'Stato',
        'statuses' => [
            'active' => 'Attivo',
            'disabled' => 'Disattivato',
        ],
        'created_at' => 'Iscritto il',
        'you' => 'Tu',
        // Actions
        'make_admin' => 'Rendi admin',
        'make_admin_confirm' => ':name potrà aprire questo pannello e modificare la libreria pubblica e gli utenti.',
        'remove_admin' => 'Togli admin',
        'remove_admin_confirm' => ':name non potrà più aprire questo pannello.',
        'disable' => 'Disattiva',
        'disable_confirm' => ':name viene disconnesso subito e non può più accedere, né con la password né con Google. Piani e allenamenti restano.',
        'enable' => 'Riattiva',
        'enable_confirm' => ':name potrà accedere di nuovo.',
        'done' => 'Salvato.',
    ],
];
