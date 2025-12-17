<?php

declare(strict_types=1);

namespace App\Domain\Patient\Entities;

final readonly class Address
{
    public function __construct(
        public string $street,
        public string $number,
        public ?string $complement,
        public string $neighborhood,
        public string $city,
        public string $state,
        public string $zipcode,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            street: $data['street'] ?? $data['address_street'],
            number: $data['number'] ?? $data['address_number'],
            complement: $data['complement'] ?? $data['address_complement'] ?? null,
            neighborhood: $data['neighborhood'] ?? $data['address_neighborhood'],
            city: $data['city'] ?? $data['address_city'],
            state: $data['state'] ?? $data['address_state'],
            zipcode: preg_replace('/\D/', '', $data['zipcode'] ?? $data['address_zipcode']),
        );
    }

    public function formatted(): string
    {
        $address = "{$this->street}, {$this->number}";
        
        if ($this->complement) {
            $address .= " - {$this->complement}";
        }
        
        $address .= "\n{$this->neighborhood} - {$this->city}/{$this->state}";
        $address .= "\nCEP: {$this->formattedZipcode()}";
        
        return $address;
    }

    public function formattedZipcode(): string
    {
        return preg_replace('/(\d{5})(\d{3})/', '$1-$2', $this->zipcode);
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'number' => $this->number,
            'complement' => $this->complement,
            'neighborhood' => $this->neighborhood,
            'city' => $this->city,
            'state' => $this->state,
            'zipcode' => $this->zipcode,
        ];
    }
}
