<?php

namespace App\Enums;

enum ConditionGrade : string
{
    case Mulus = 'mulus';
    case LecetRingan = 'lecet_ringan';
    case PerluPerbaikan = 'perlu_perbaikan';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

