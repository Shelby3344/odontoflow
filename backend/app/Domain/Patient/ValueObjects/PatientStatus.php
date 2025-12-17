<?php

declare(strict_types=1);

namespace App\Domain\Patient\ValueObjects;

enum PatientStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case BLOCKED = 'blocked';

    public static function active(): self
    {
        return self::ACTIVE;
    }

    public static function inactive(): self
    {
        return self::INACTIVE;
    }

    public static function blocked(): self
    {
        return self::BLOCKED;
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Ativo',
            self::INACTIVE => 'Inativo',
            self::BLOCKED => 'Bloqueado',
        };
    }
}
