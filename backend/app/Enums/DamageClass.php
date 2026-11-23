<?php

namespace App\Enums;

/**
 * Kelas deteksi sesuai metadata model aktual `model_damage.onnx` (PRD Bab 3.2 & 19.5).
 * `Accident` TIDAK boleh diganti/dinamai `crack`.
 */
enum DamageClass: string
{
    case Accident = 'Accident';
    case Dent = 'Dent';
    case Scratch = 'Scratch';

    public function classIndex(): int
    {
        return match ($this) {
            self::Accident => 0,
            self::Dent => 1,
            self::Scratch => 2,
        };
    }

    /** Nama kolom hitung pada tabel motorcycles / motorcycle_inspections. */
    public function countColumn(): string
    {
        return match ($this) {
            self::Accident => 'accident_count',
            self::Dent => 'dent_count',
            self::Scratch => 'scratch_count',
        };
    }

    /** Deskripsi netral untuk UI (PRD Bab 3.2). */
    public function neutralLabel(): string
    {
        return match ($this) {
            self::Accident => 'Indikasi kerusakan kategori accident',
            self::Dent => 'Indikasi penyok',
            self::Scratch => 'Indikasi baret/goresan',
        };
    }

    public static function fromIndex(int $index): self
    {
        foreach (self::cases() as $case) {
            if ($case->classIndex() === $index) {
                return $case;
            }
        }
        throw new \InvalidArgumentException("Indeks kelas tidak dikenal: {$index}");
    }
}
