<?php

namespace App\Enums;

/**
 * The languages of the app (docs/02-decisions.md 2.4), the values of the
 * `users.locale` column.
 *
 * An enum is a type with a fixed list of values. `: string` makes it "backed":
 * each case has the plain string stored in the database, read with
 * `Locale::It->value`. Compared with bare strings, a typo such as
 * `Locale::Itt` is an error at once (docs/06-data-model.md 6.2.4). The frontend
 * has the same list in src/i18n/languages.ts.
 */
enum Locale: string
{
    case It = 'it';
    case En = 'en';
    case Es = 'es';
    case De = 'de';

    /**
     * Every language code, English first: the order the browser's languages
     * are matched in, so English is the answer when none of them is ours.
     *
     * @return list<string>
     */
    public static function codes(): array
    {
        return [self::En->value, self::It->value, self::Es->value, self::De->value];
    }
}
