<?php

namespace App\Enums;

enum MotorcycleCategory: string
{
    case Matic = 'matic';
    case Sport = 'sport';
    case Bebek = 'bebek';
    case Klasik = 'klasik';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
