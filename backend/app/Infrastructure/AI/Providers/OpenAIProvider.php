<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\Providers;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;

final class OpenAIProvider implements LLMProviderInterface
{
    private string $model;
    private int $maxRetries;

    public function __construct()
    {
        $this->model = config('ai.openai.model', 'gpt-4-turbo-preview');
        $this->maxRetries = config('ai.openai.max_retries', 3);
    }

    public function complete(array $params): array
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxRetries) {
            try {
                $response = OpenAI::chat()->create([
                    'model' => $this->model,
                    'messages' => $params['messages'],
                    'temperature' => $params['temperature'] ?? 0.3,
                    'max_tokens' => $params['max_tokens'] ?? 2000,
                    'response_format' => ['type' => 'json_object'],
                ]);

                return [
                    'content' => $response->choices[0]->message->content,
                    'model' => $response->model,
                    'finish_reason' => $response->choices[0]->finishReason,
                    'usage' => [
                        'prompt_tokens' => $response->usage->promptTokens,
                        'completion_tokens' => $response->usage->completionTokens,
                        'total_tokens' => $response->usage->totalTokens,
                    ],
                ];

            } catch (\Throwable $e) {
                $lastException = $e;
                $attempt++;

                Log::warning('OpenAI API retry', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt < $this->maxRetries) {
                    sleep(pow(2, $attempt)); // Exponential backoff
                }
            }
        }

        throw $lastException;
    }

    public function embed(string $text): array
    {
        $response = OpenAI::embeddings()->create([
            'model' => 'text-embedding-ada-002',
            'input' => $text,
        ]);

        return $response->embeddings[0]->embedding;
    }

    public function streamComplete(array $params): \Generator
    {
        $stream = OpenAI::chat()->createStreamed([
            'model' => $this->model,
            'messages' => $params['messages'],
            'temperature' => $params['temperature'] ?? 0.3,
            'max_tokens' => $params['max_tokens'] ?? 2000,
        ]);

        foreach ($stream as $response) {
            $content = $response->choices[0]->delta->content ?? '';
            if ($content) {
                yield $content;
            }
        }
    }
}
