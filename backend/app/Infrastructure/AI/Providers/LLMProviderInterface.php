<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\Providers;

interface LLMProviderInterface
{
    /**
     * Completa uma requisição de chat
     */
    public function complete(array $params): array;

    /**
     * Gera embedding para texto
     */
    public function embed(string $text): array;

    /**
     * Completa com streaming
     */
    public function streamComplete(array $params): \Generator;
}
