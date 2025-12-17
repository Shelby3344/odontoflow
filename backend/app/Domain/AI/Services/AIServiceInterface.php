<?php

declare(strict_types=1);

namespace App\Domain\AI\Services;

use App\Domain\AI\DTOs\AIRequest;
use App\Domain\AI\DTOs\AIResponse;

interface AIServiceInterface
{
    /**
     * Gera evolução clínica baseada no contexto do atendimento
     */
    public function generateClinicalEvolution(AIRequest $request): AIResponse;
    
    /**
     * Sugere diagnósticos baseado nos sintomas e histórico
     */
    public function suggestDiagnosis(AIRequest $request): AIResponse;
    
    /**
     * Sugere plano de tratamento
     */
    public function suggestTreatmentPlan(AIRequest $request): AIResponse;
    
    /**
     * Analisa risco de falta do paciente
     */
    public function analyzeNoShowRisk(AIRequest $request): AIResponse;
    
    /**
     * Gera insights financeiros
     */
    public function generateFinancialInsights(AIRequest $request): AIResponse;
    
    /**
     * Responde perguntas do assistente
     */
    public function chat(AIRequest $request): AIResponse;
    
    /**
     * Gera mensagem personalizada para comunicação
     */
    public function generateMessage(AIRequest $request): AIResponse;
}
