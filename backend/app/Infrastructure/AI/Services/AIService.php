<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\Services;

use App\Domain\AI\Services\AIServiceInterface;
use App\Domain\AI\DTOs\AIRequest;
use App\Domain\AI\DTOs\AIResponse;
use App\Infrastructure\AI\ContextBuilder\ContextBuilder;
use App\Infrastructure\AI\PromptBuilder\PromptBuilder;
use App\Infrastructure\AI\RAG\RAGEngine;
use App\Infrastructure\AI\Providers\LLMProviderInterface;
use App\Infrastructure\AI\Repositories\AIInteractionRepository;
use Illuminate\Support\Facades\Log;

final class AIService implements AIServiceInterface
{
    public function __construct(
        private readonly ContextBuilder $contextBuilder,
        private readonly PromptBuilder $promptBuilder,
        private readonly RAGEngine $ragEngine,
        private readonly LLMProviderInterface $llmProvider,
        private readonly AIInteractionRepository $interactionRepository,
    ) {}

    public function generateClinicalEvolution(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildClinicalEvolutionPrompt($context, $ragResults);
        });
    }

    public function suggestDiagnosis(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildDiagnosisPrompt($context, $ragResults);
        });
    }

    public function suggestTreatmentPlan(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildTreatmentPlanPrompt($context, $ragResults);
        });
    }

    public function analyzeNoShowRisk(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildNoShowRiskPrompt($context, $ragResults);
        });
    }

    public function generateFinancialInsights(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildFinancialInsightsPrompt($context, $ragResults);
        });
    }

    public function chat(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) use ($request) {
            return $this->promptBuilder->buildChatPrompt(
                $request->userMessage,
                $context,
                $ragResults
            );
        });
    }

    public function generateMessage(AIRequest $request): AIResponse
    {
        return $this->process($request, function (array $context, array $ragResults) {
            return $this->promptBuilder->buildMessagePrompt($context, $ragResults);
        });
    }

    private function process(AIRequest $request, callable $promptFactory): AIResponse
    {
        $startTime = microtime(true);

        try {
            // 1. Construir contexto enriquecido
            $context = $this->contextBuilder->build($request);

            // 2. Buscar conhecimento relevante via RAG
            $ragResults = $this->ragEngine->search($request->type, $context);

            // 3. Construir prompt estruturado
            $prompt = $promptFactory($context, $ragResults);

            // 4. Chamar LLM
            $llmResponse = $this->llmProvider->complete($prompt);

            // 5. Processar resposta
            $response = $this->parseResponse($request->type, $llmResponse);

            // 6. Registrar interação
            $this->logInteraction($request, $prompt, $response, $startTime);

            return $response;

        } catch (\Throwable $e) {
            Log::error('AI Service Error', [
                'type' => $request->type,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return AIResponse::failure($request->type, $e->getMessage());
        }
    }

    private function parseResponse(string $type, array $llmResponse): AIResponse
    {
        $content = $llmResponse['content'] ?? '';
        $usage = $llmResponse['usage'] ?? [];

        // Tentar extrair JSON estruturado se presente
        $parsed = $this->extractStructuredContent($content);

        $confidence = $this->calculateConfidence($llmResponse, $parsed);

        return AIResponse::success(
            type: $type,
            content: $parsed ?? $content,
            confidence: $confidence,
            metadata: [
                'model' => $llmResponse['model'] ?? 'unknown',
                'tokens' => $usage,
                'raw_content' => is_array($parsed) ? $content : null,
            ],
        );
    }

    private function extractStructuredContent(string $content): mixed
    {
        // Tentar extrair JSON do conteúdo
        if (preg_match('/```json\s*([\s\S]*?)\s*```/', $content, $matches)) {
            $json = json_decode($matches[1], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $json;
            }
        }

        // Tentar parse direto
        $json = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $json;
        }

        return $content;
    }

    private function calculateConfidence(array $llmResponse, mixed $parsed): float
    {
        $confidence = 0.5;

        // Aumentar confiança se conseguiu extrair estrutura
        if (is_array($parsed)) {
            $confidence += 0.2;
        }

        // Usar finish_reason se disponível
        if (($llmResponse['finish_reason'] ?? '') === 'stop') {
            $confidence += 0.1;
        }

        // Verificar se há campos obrigatórios preenchidos
        if (is_array($parsed) && !empty($parsed)) {
            $confidence += 0.1;
        }

        return min(1.0, $confidence);
    }

    private function logInteraction(
        AIRequest $request,
        array $prompt,
        AIResponse $response,
        float $startTime
    ): void {
        $latency = (int) ((microtime(true) - $startTime) * 1000);

        $this->interactionRepository->create([
            'user_id' => $request->userId,
            'context_type' => $request->type,
            'context_data' => $request->context,
            'prompt' => json_encode($prompt),
            'model' => $response->metadata['model'] ?? 'unknown',
            'response' => is_string($response->content) 
                ? $response->content 
                : json_encode($response->content),
            'tokens_used' => $response->metadata['tokens']['total_tokens'] ?? 0,
            'latency_ms' => $latency,
            'cost_usd' => $this->calculateCost($response->metadata['tokens'] ?? []),
        ]);
    }

    private function calculateCost(array $tokens): float
    {
        // Preços aproximados GPT-4 (ajustar conforme modelo)
        $inputCost = ($tokens['prompt_tokens'] ?? 0) * 0.00003;
        $outputCost = ($tokens['completion_tokens'] ?? 0) * 0.00006;
        
        return round($inputCost + $outputCost, 6);
    }
}
