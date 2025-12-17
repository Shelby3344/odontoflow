<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\RAG;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

final class RAGEngine
{
    private const CACHE_TTL = 3600; // 1 hora

    public function __construct(
        private readonly EmbeddingService $embeddingService,
    ) {}

    /**
     * Busca conhecimento relevante para o contexto
     */
    public function search(string $type, array $context, int $limit = 5): array
    {
        // Gerar query de busca baseada no contexto
        $searchQuery = $this->buildSearchQuery($type, $context);
        
        // Verificar cache
        $cacheKey = 'rag:' . md5($searchQuery . $type);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($searchQuery, $type, $limit) {
            return $this->performSearch($searchQuery, $type, $limit);
        });
    }

    /**
     * Adiciona conhecimento à base
     */
    public function addKnowledge(
        string $category,
        string $title,
        string $content,
        ?string $subcategory = null,
        array $metadata = [],
    ): void {
        // Gerar embedding
        $embedding = $this->embeddingService->generate($content);

        DB::table('knowledge_base')->insert([
            'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'category' => $category,
            'subcategory' => $subcategory,
            'title' => $title,
            'content' => $content,
            'embedding' => $this->formatEmbedding($embedding),
            'metadata' => json_encode($metadata),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Atualiza conhecimento existente
     */
    public function updateKnowledge(string $id, string $content): void
    {
        $embedding = $this->embeddingService->generate($content);

        DB::table('knowledge_base')
            ->where('id', $id)
            ->update([
                'content' => $content,
                'embedding' => $this->formatEmbedding($embedding),
                'updated_at' => now(),
            ]);

        // Limpar cache relacionado
        Cache::tags(['rag'])->flush();
    }

    private function buildSearchQuery(string $type, array $context): string
    {
        return match ($type) {
            'clinical_evolution' => $this->buildClinicalQuery($context),
            'diagnosis_suggestion' => $this->buildDiagnosisQuery($context),
            'treatment_plan' => $this->buildTreatmentQuery($context),
            'chat' => $context['user_message'] ?? '',
            default => json_encode($context),
        };
    }

    private function buildClinicalQuery(array $context): string
    {
        $parts = [];

        if (!empty($context['procedures'])) {
            $parts[] = 'procedimentos: ' . implode(', ', array_column($context['procedures'], 'name'));
        }

        if (!empty($context['appointment']['type'])) {
            $parts[] = 'tipo de atendimento: ' . $context['appointment']['type'];
        }

        if (!empty($context['patient_profile'])) {
            $parts[] = 'perfil do paciente';
        }

        return implode('. ', $parts) ?: 'evolução clínica odontológica';
    }

    private function buildDiagnosisQuery(array $context): string
    {
        $parts = [];

        if (!empty($context['symptoms'])) {
            $parts[] = 'sintomas: ' . implode(', ', $context['symptoms']);
        }

        if (!empty($context['clinical_exam'])) {
            $parts[] = 'exame clínico: ' . json_encode($context['clinical_exam']);
        }

        return implode('. ', $parts) ?: 'diagnóstico odontológico';
    }

    private function buildTreatmentQuery(array $context): string
    {
        $parts = [];

        if (!empty($context['diagnosis'])) {
            $parts[] = 'diagnóstico: ' . implode(', ', (array) $context['diagnosis']);
        }

        if (!empty($context['odontogram_summary']['needs_attention'])) {
            $parts[] = 'dentes afetados: ' . implode(', ', $context['odontogram_summary']['needs_attention']);
        }

        return implode('. ', $parts) ?: 'plano de tratamento odontológico';
    }

    private function performSearch(string $query, string $type, int $limit): array
    {
        // Gerar embedding da query
        $queryEmbedding = $this->embeddingService->generate($query);

        // Busca vetorial com pgvector
        $results = DB::select("
            SELECT 
                id,
                category,
                subcategory,
                title,
                content,
                metadata,
                1 - (embedding <=> :embedding) as similarity
            FROM knowledge_base
            WHERE is_active = true
            AND (
                category = :type 
                OR category = 'general'
                OR category = 'protocols'
            )
            ORDER BY embedding <=> :embedding2
            LIMIT :limit
        ", [
            'embedding' => $this->formatEmbedding($queryEmbedding),
            'embedding2' => $this->formatEmbedding($queryEmbedding),
            'type' => $type,
            'limit' => $limit,
        ]);

        return array_map(fn($row) => [
            'id' => $row->id,
            'category' => $row->category,
            'subcategory' => $row->subcategory,
            'title' => $row->title,
            'content' => $row->content,
            'metadata' => json_decode($row->metadata, true),
            'similarity' => round($row->similarity, 4),
        ], $results);
    }

    private function formatEmbedding(array $embedding): string
    {
        return '[' . implode(',', $embedding) . ']';
    }
}
