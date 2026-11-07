<?php

/**
 * Validation messages (docs/concepts/C2-backend.md C2.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'array' => 'El campo :attribute debe ser una lista.',
    'between' => [
        'numeric' => 'El campo :attribute debe estar entre :min y :max.',
    ],
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'decimal' => 'El campo :attribute debe tener :decimal decimales.',
    'distinct' => 'El campo :attribute tiene un valor repetido.',
    'email' => 'El campo :attribute debe ser una dirección de correo válida.',
    'enum' => 'El valor de :attribute no es válido.',
    'exists' => 'El valor elegido para :attribute no existe.',
    'gte' => [
        'numeric' => 'El campo :attribute debe ser al menos :value.',
    ],
    'integer' => 'El campo :attribute debe ser un número entero.',
    'max' => [
        'array' => 'El campo :attribute no puede tener más de :max elementos.',
        'string' => 'El campo :attribute no puede superar los :max caracteres.',
    ],
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'numeric' => 'El campo :attribute debe ser un número.',
    'present' => 'El campo :attribute debe estar presente.',
    'regex' => 'El formato de :attribute no es válido.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_with' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'string' => 'El campo :attribute debe ser un texto.',
    'superset_neighbours' => 'Los ejercicios de una superserie deben ir seguidos.',
    'superset_size' => 'Una superserie debe tener al menos dos ejercicios.',
    'unique' => 'Este valor de :attribute ya está en uso.',
    'url' => 'El campo :attribute debe ser una dirección web válida.',
    'uuid' => 'El campo :attribute debe ser un UUID válido.',

    // How each field is called inside a message
    'attributes' => [
        'name' => 'nombre',
        'email' => 'correo',
        'password' => 'contraseña',
        'locale' => 'idioma',
        'theme' => 'tema',
        'description' => 'descripción',
        'aliases' => 'nombres alternativos',
        'aliases.*' => 'nombre alternativo',
        'instructions' => 'instrucciones',
        'instructions.*' => 'paso',
        'logging_type' => 'tipo de registro',
        'equipment_id' => 'equipamiento',
        'youtube_url' => 'enlace de YouTube',
        'muscles' => 'músculos',
        'muscles.*.id' => 'músculo',
        'muscles.*.role' => 'función del músculo',

        // The workout plans (PlanRequest)
        'archived' => 'archivados',
        'goal' => 'objetivo',
        'notes' => 'notas',
        'version' => 'versión',
        'days' => 'días',
        'days.*.id' => 'id del día',
        'days.*.name' => 'nombre del día',
        'days.*.items' => 'ejercicios del día',
        'days.*.items.*.id' => 'id del ejercicio en el plan',
        'days.*.items.*.exercise_id' => 'ejercicio',
        'days.*.items.*.superset_group' => 'superserie',
        'days.*.items.*.rest_seconds' => 'descanso',
        'days.*.items.*.notes' => 'notas',
        'days.*.items.*.sets' => 'series',
        'days.*.items.*.sets.*.set_type' => 'tipo de serie',
        'days.*.items.*.sets.*.target_reps_min' => 'repeticiones mínimas',
        'days.*.items.*.sets.*.target_reps_max' => 'repeticiones máximas',
        'days.*.items.*.sets.*.target_weight_kg' => 'peso',
        'days.*.items.*.sets.*.target_rpe' => 'RPE',
        'days.*.items.*.sets.*.target_duration_seconds' => 'duración',
        'days.*.items.*.sets.*.target_distance_meters' => 'distancia',
    ],
];
