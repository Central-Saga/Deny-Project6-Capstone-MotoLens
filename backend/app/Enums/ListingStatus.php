<?php

namespace App\Enums;

enum ListingStatus: string
{
    case Available = 'available';
    case Booked = 'booked';
    case Sold = 'sold';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
