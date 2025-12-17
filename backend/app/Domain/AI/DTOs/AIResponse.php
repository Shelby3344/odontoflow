<?php

declare(strict_types=1);

namespace App\Domain\AI\DTOs;

final readonly class AIResponse
{
    public function __construct(
        public bool $success,
        public string $type,
        public mixed $content,
        public float $confidence,
        public array $metadata,
        public ?string $error = null,
    ) {}

    public static function success(
        string $type,
        mixed $content,
        float $confidence = 0.0,
        array $metadata = [],
    ): self {
        return new self(
            success: true,
            type: $type,
            content: $content,
            confidence: $confidence,
            metadata: $metadata,
        );
    }

    public static function failure(string $type, string $error): self
    {
        return new self(
            success: false,
            type: $type,
            content: null,
            confidence: 0.0,
            metadata: [],
            error: $error,
        );
    }

    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    public function requiresReview(): bool
    {
        return $this->confidence < 0.7;
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'type' => $this->type,
            'content' => $this->content,
            'confidence' => $this->confidence,
            'metadata' => $this->metadata,
            'error' => $this->error,
            'requires_review' => $this->requiresReview(),
        ];
    }
}
