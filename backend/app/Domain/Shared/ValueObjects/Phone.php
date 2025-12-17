<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

final readonly class Phone
{
    private function __construct(
        private string $countryCode,
        private string $areaCode,
        private string $number
    ) {}

    public static function fromString(string $value): self
    {
        $cleaned = preg_replace('/\D/', '', $value);
        
        // Formato brasileiro: +55 (11) 99999-9999
        if (strlen($cleaned) === 13 && str_starts_with($cleaned, '55')) {
            return new self(
                countryCode: '55',
                areaCode: substr($cleaned, 2, 2),
                number: substr($cleaned, 4)
            );
        }

        if (strlen($cleaned) === 11) {
            return new self(
                countryCode: '55',
                areaCode: substr($cleaned, 0, 2),
                number: substr($cleaned, 2)
            );
        }

        if (strlen($cleaned) === 10) {
            return new self(
                countryCode: '55',
                areaCode: substr($cleaned, 0, 2),
                number: substr($cleaned, 2)
            );
        }

        throw new InvalidArgumentException("Invalid phone number: {$value}");
    }

    public function toString(): string
    {
        return $this->countryCode . $this->areaCode . $this->number;
    }

    public function formatted(): string
    {
        $number = $this->number;
        
        if (strlen($number) === 9) {
            $number = substr($number, 0, 5) . '-' . substr($number, 5);
        } else {
            $number = substr($number, 0, 4) . '-' . substr($number, 4);
        }

        return "+{$this->countryCode} ({$this->areaCode}) {$number}";
    }

    public function whatsappLink(): string
    {
        return "https://wa.me/{$this->countryCode}{$this->areaCode}{$this->number}";
    }

    public function isMobile(): bool
    {
        return strlen($this->number) === 9 && $this->number[0] === '9';
    }

    public function countryCode(): string
    {
        return $this->countryCode;
    }

    public function areaCode(): string
    {
        return $this->areaCode;
    }

    public function number(): string
    {
        return $this->number;
    }

    public function equals(self $other): bool
    {
        return $this->toString() === $other->toString();
    }

    public function __toString(): string
    {
        return $this->formatted();
    }
}
