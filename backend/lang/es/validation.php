<?php

/**
 * Validation messages (docs/concepts/C2-backend.md C2.7.7): only the rules the app uses so
 * far, the others fall back to English. A new rule in a Form Request adds its
 * message to the three languages. :attribute is filled from the attributes list below.
 */
return [
    'array' => 'El campo :attribute debe ser una lista.',
    'confirmed' => 'La confirmación de :attribute no coincide.',
    'distinct' => 'El campo :attribute tiene un valor repetido.',
    'email' => 'El campo :attribute debe ser una dirección de correo válida.',
    'enum' => 'El valor de :attribute no es válido.',
    'exists' => 'El valor elegido para :attribute no existe.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'max' => [
        'array' => 'El campo :attribute no puede tener más de :max elementos.',
        'string' => 'El campo :attribute no puede superar los :max caracteres.',
    ],
    'min' => [
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
    ],
    'regex' => 'El formato de :attribute no es válido.',
    'required' => 'El campo :attribute es obligatorio.',
    'string' => 'El campo :attribute debe ser un texto.',
    'unique' => 'Este valor de :attribute ya está en uso.',
    'url' => 'El campo :attribute debe ser una dirección web válida.',

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
    ],
];
