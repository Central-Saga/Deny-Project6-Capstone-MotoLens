<?php

namespace App\Enums;

enum FeedbackType : string
{
    case FalsePositive = 'false_positive';
    case FalseNegative = 'false_negative';
    case IncorrectClass = 'incorrect_class';
    case Other = 'other';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

