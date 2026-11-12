<?php

/**
 * The admin panel's own texts, in Spanish: the same keys as
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
        'weight_reps' => 'Peso y repeticiones',
        'reps' => 'Repeticiones',
        'time' => 'Tiempo',
        'distance' => 'Distancia',
    ],

    'google' => [
        'continue' => 'Continuar con Google',
        'or' => 'o',
        'errors' => [
            'cancelled' => 'Se ha cancelado el inicio de sesión con Google. Inténtalo de nuevo o usa tu correo.',
            'failed' => 'No se ha podido iniciar sesión con Google. Inténtalo de nuevo en un momento.',
            'unverified' => 'Google no ha verificado este correo, así que no se puede usar para iniciar sesión.',
            'disabled' => 'Esta cuenta ha sido desactivada.',
        ],
    ],

    'exercises' => [
        'label' => 'ejercicio',
        'plural_label' => 'ejercicios',
        'navigation' => 'Biblioteca de ejercicios',
        // Table
        'photo' => 'Foto',
        'name' => 'Nombre',
        'equipment' => 'Material',
        'primary_muscles' => 'Músculos principales',
        'secondary_muscles' => 'Músculos secundarios',
        'logging_type' => 'Se registra como',
        'to_review' => 'Por revisar',
        'source' => 'Origen',
        'sources' => [
            'free_exercise_db' => 'free-exercise-db',
            'extra' => 'Extra de AtleoPlan',
            'panel' => 'Panel de administración',
        ],
        'updated_at' => 'Modificado',
        'to_review_in' => 'Por revisar en',
        // Form
        'texts' => 'Textos',
        'texts_help' => 'El inglés es el original. Un idioma que se deja vacío se elimina; la app muestra entonces el inglés.',
        'aliases' => 'Otros nombres',
        'aliases_help' => 'Nombres con los que la gente lo busca. Pulsa Intro después de cada uno.',
        'description' => 'Descripción',
        'instructions' => 'Pasos',
        'add_step' => 'Añadir un paso',
        'reviewed' => 'Revisado por una persona',
        'reviewed_help' => 'Desactivado: traducción automática, aún por comprobar.',
        'english_original' => 'Original en inglés',
        'details' => 'Ejercicio',
        'youtube_url' => 'Vídeo de YouTube',
        'source_details' => 'Origen',
        'external_id' => 'Importado como :id',
        'created_in_panel' => 'Creado en el panel de administración.',
        'photos' => '{0} Sin fotos.|{1} 1 foto.|[2,*] :count fotos.',
        'photos_help' => 'Las fotos y los vídeos se gestionarán en una próxima versión de esta pantalla.',
    ],

    'users' => [
        'label' => 'usuario',
        'plural_label' => 'usuarios',
        'navigation' => 'Usuarios',
        // Table
        'name' => 'Nombre',
        'email' => 'Correo',
        'role' => 'Rol',
        'roles' => [
            'admin' => 'Admin',
            'user' => 'Usuario',
        ],
        'google' => 'Google',
        'status' => 'Estado',
        'statuses' => [
            'active' => 'Activo',
            'disabled' => 'Desactivado',
        ],
        'created_at' => 'Registrado',
        'you' => 'Tú',
        // Actions
        'make_admin' => 'Hacer admin',
        'make_admin_confirm' => ':name podrá abrir este panel y modificar la biblioteca pública y los usuarios.',
        'remove_admin' => 'Quitar admin',
        'remove_admin_confirm' => ':name ya no podrá abrir este panel.',
        'disable' => 'Desactivar',
        'disable_confirm' => 'Se cierra la sesión de :name al instante y ya no puede entrar, ni con contraseña ni con Google. Sus planes y entrenamientos se conservan.',
        'enable' => 'Reactivar',
        'enable_confirm' => ':name podrá entrar de nuevo.',
        'done' => 'Guardado.',
    ],
];
