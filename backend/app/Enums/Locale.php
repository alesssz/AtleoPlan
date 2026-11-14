<?php

namespace App\Enums;

/**
 * The app's languages, stored in `users.locale`. The frontend has the same list
 * in src/i18n/languages.ts.
 */
enum Locale: string
{
    case It = 'it';
    case En = 'en';
    case Es = 'es';
    case De = 'de';

    /**
     * English first: the browser's languages are matched in this order, so
     * English wins when none of them is supported.
     *
     * @return list<string>
     */
    public static function codes(): array
    {
        return [self::En->value, self::It->value, self::Es->value, self::De->value];
    }
}
