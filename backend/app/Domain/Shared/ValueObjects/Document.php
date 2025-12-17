<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

final readonly class Document
{
    private function __construct(
        private string $value,
        private string $type
    ) {}

    public static function fromCpf(string $value): self
    {
        $cleaned = preg_replace('/\D/', '', $value);
        
        if (!self::isValidCpf($cleaned)) {
            throw new InvalidArgumentException("Invalid CPF: {$value}");
        }

        return new self($cleaned, 'cpf');
    }

    public static function fromCnpj(string $value): self
    {
        $cleaned = preg_replace('/\D/', '', $value);
        
        if (!self::isValidCnpj($cleaned)) {
            throw new InvalidArgumentException("Invalid CNPJ: {$value}");
        }

        return new self($cleaned, 'cnpj');
    }

    private static function isValidCpf(string $cpf): bool
    {
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            $d = 0;
            for ($c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }

        return true;
    }

    private static function isValidCnpj(string $cnpj): bool
    {
        if (strlen($cnpj) !== 14 || preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }

        $weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += $cnpj[$i] * $weights1[$i];
        }
        $digit1 = $sum % 11 < 2 ? 0 : 11 - ($sum % 11);

        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += $cnpj[$i] * $weights2[$i];
        }
        $digit2 = $sum % 11 < 2 ? 0 : 11 - ($sum % 11);

        return $cnpj[12] == $digit1 && $cnpj[13] == $digit2;
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function formatted(): string
    {
        if ($this->type === 'cpf') {
            return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $this->value);
        }

        return preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $this->value);
    }

    public function masked(): string
    {
        if ($this->type === 'cpf') {
            return substr($this->value, 0, 3) . '.***.**' . substr($this->value, -2);
        }

        return substr($this->value, 0, 2) . '.***.***/****-' . substr($this->value, -2);
    }

    public function hash(): string
    {
        return hash('sha256', $this->value);
    }

    public function type(): string
    {
        return $this->type;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value && $this->type === $other->type;
    }
}
