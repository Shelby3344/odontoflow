<?php

declare(strict_types=1);

namespace App\Infrastructure\AI\PromptBuilder;

final class PromptBuilder
{
    private const SYSTEM_BASE = <<<PROMPT
Você é um assistente especializado em odontologia, integrado ao sistema OdontoFlow.
Seu papel é auxiliar profissionais de odontologia com informações precisas e relevantes.

REGRAS FUNDAMENTAIS:
1. Nunca substitua o julgamento clínico do profissional
2. Sempre indique quando uma avaliação presencial é necessária
3. Não prescreva medicamentos diretamente
4. Mantenha linguagem técnica apropriada
5. Respeite a confidencialidade dos dados do paciente
6. Indique o nível de confiança das suas sugestões
PROMPT;

    public function buildClinicalEvolutionPrompt(array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Gerar evolução clínica para prontuário odontológico.

ESTRUTURA DA EVOLUÇÃO:
1. Queixa Principal (QP)
2. Exame Clínico (EC)
3. Diagnóstico (DX)
4. Procedimentos Realizados (PR)
5. Orientações ao Paciente (OP)
6. Plano de Retorno (RET)

FORMATO DE SAÍDA (JSON):
{
    "evolution_text": "texto completo da evolução",
    "structured": {
        "chief_complaint": "...",
        "clinical_examination": "...",
        "diagnosis": "...",
        "procedures_performed": "...",
        "patient_instructions": "...",
        "follow_up": "..."
    },
    "confidence": 0.0-1.0,
    "suggestions": ["sugestões adicionais se houver"]
}
PROMPT;

        $userPrompt = $this->buildUserPrompt($context, $ragResults, 'evolução clínica');

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    public function buildDiagnosisPrompt(array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Sugerir possíveis diagnósticos como apoio à decisão clínica.

IMPORTANTE:
- Estas são SUGESTÕES para consideração do profissional
- Sempre liste múltiplas possibilidades quando aplicável
- Indique exames complementares se necessário
- Nunca afirme diagnósticos definitivos

FORMATO DE SAÍDA (JSON):
{
    "primary_suggestions": [
        {
            "diagnosis": "nome do diagnóstico",
            "icd_code": "código CID se aplicável",
            "confidence": 0.0-1.0,
            "reasoning": "justificativa baseada nos dados",
            "differential": ["diagnósticos diferenciais"]
        }
    ],
    "recommended_exams": ["exames sugeridos"],
    "red_flags": ["sinais de alerta se houver"],
    "notes": "observações adicionais"
}
PROMPT;

        $userPrompt = $this->buildUserPrompt($context, $ragResults, 'sugestão de diagnóstico');

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    public function buildTreatmentPlanPrompt(array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Sugerir plano de tratamento odontológico.

CONSIDERAR:
- Priorização por urgência clínica
- Preferências do paciente
- Histórico e condições sistêmicas
- Alternativas de tratamento
- Estimativa de sessões e tempo

FORMATO DE SAÍDA (JSON):
{
    "treatment_phases": [
        {
            "phase": 1,
            "name": "nome da fase",
            "procedures": [
                {
                    "procedure": "nome do procedimento",
                    "tooth": "dente(s) envolvido(s)",
                    "priority": "alta/média/baixa",
                    "estimated_sessions": 1,
                    "estimated_duration_minutes": 60
                }
            ],
            "rationale": "justificativa da fase"
        }
    ],
    "alternatives": ["tratamentos alternativos"],
    "contraindications": ["contraindicações identificadas"],
    "total_estimated_sessions": 0,
    "notes": "observações"
}
PROMPT;

        $userPrompt = $this->buildUserPrompt($context, $ragResults, 'plano de tratamento');

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    public function buildNoShowRiskPrompt(array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Analisar risco de não comparecimento do paciente.

FATORES A CONSIDERAR:
- Histórico de comparecimento
- Dia e horário da consulta
- Tempo desde última visita
- Padrões da clínica
- Tipo de procedimento

FORMATO DE SAÍDA (JSON):
{
    "risk_score": 0.0-1.0,
    "risk_level": "baixo/médio/alto",
    "risk_factors": [
        {
            "factor": "descrição do fator",
            "impact": "alto/médio/baixo"
        }
    ],
    "recommendations": [
        {
            "action": "ação sugerida",
            "timing": "quando executar",
            "channel": "canal de comunicação"
        }
    ],
    "suggested_overbooking": true/false
}
PROMPT;

        $userPrompt = $this->buildUserPrompt($context, $ragResults, 'análise de risco');

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    public function buildFinancialInsightsPrompt(array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Gerar insights financeiros para a clínica.

ANÁLISES:
- Tratamentos abandonados
- Pacientes inativos com potencial
- Oportunidades de receita
- Padrões de inadimplência
- Otimização de agenda

FORMATO DE SAÍDA (JSON):
{
    "insights": [
        {
            "type": "tipo do insight",
            "title": "título",
            "description": "descrição detalhada",
            "impact": "alto/médio/baixo",
            "potential_value": 0.00,
            "recommended_action": "ação sugerida"
        }
    ],
    "metrics_summary": {
        "abandoned_treatments_value": 0.00,
        "inactive_patients_potential": 0.00,
        "collection_rate": 0.0
    },
    "recommendations": ["recomendações gerais"]
}
PROMPT;

        $userPrompt = $this->buildUserPrompt($context, $ragResults, 'insights financeiros');

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    public function buildChatPrompt(string $message, array $context, array $ragResults): array
    {
        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Responder perguntas e auxiliar o profissional.

CAPACIDADES:
- Responder dúvidas sobre procedimentos
- Auxiliar com documentação clínica
- Fornecer informações sobre protocolos
- Sugerir abordagens terapêuticas
- Esclarecer terminologia

LIMITAÇÕES:
- Não prescrever medicamentos
- Não fazer diagnósticos definitivos
- Não substituir avaliação presencial

Responda de forma clara, objetiva e profissional.
Se não souber algo, admita e sugira fontes de consulta.
PROMPT;

        // Adicionar contexto da conversa
        if (!empty($context['conversation'])) {
            $systemPrompt .= "\n\nHISTÓRICO DA CONVERSA:\n";
            foreach ($context['conversation'] as $msg) {
                $role = $msg['role'] === 'user' ? 'Usuário' : 'Assistente';
                $systemPrompt .= "{$role}: {$msg['content']}\n";
            }
        }

        // Adicionar conhecimento RAG
        if (!empty($ragResults)) {
            $systemPrompt .= "\n\nCONHECIMENTO RELEVANTE:\n";
            foreach ($ragResults as $result) {
                $systemPrompt .= "- {$result['content']}\n";
            }
        }

        return $this->formatMessages($systemPrompt, $message);
    }

    public function buildMessagePrompt(array $context, array $ragResults): array
    {
        $messageType = $context['message_type'] ?? 'reminder';
        $patientName = $context['patient']['name'] ?? 'Paciente';

        $systemPrompt = self::SYSTEM_BASE . "\n\n" . <<<PROMPT
TAREFA: Gerar mensagem personalizada para comunicação com paciente.

TIPO DE MENSAGEM: {$messageType}
NOME DO PACIENTE: {$patientName}

DIRETRIZES:
- Tom amigável e profissional
- Mensagem concisa e clara
- Incluir call-to-action quando apropriado
- Personalizar com nome do paciente
- Adequar ao canal (WhatsApp é mais informal)

FORMATO DE SAÍDA (JSON):
{
    "message": "texto da mensagem",
    "subject": "assunto (para email)",
    "tone": "tom utilizado",
    "has_cta": true/false,
    "cta_text": "texto do call-to-action"
}
PROMPT;

        $userPrompt = json_encode($context['message_context'] ?? [], JSON_PRETTY_PRINT);

        return $this->formatMessages($systemPrompt, $userPrompt);
    }

    private function buildUserPrompt(array $context, array $ragResults, string $task): string
    {
        $prompt = "Gere {$task} com base nos seguintes dados:\n\n";
        
        // Dados do contexto
        $prompt .= "DADOS DO CONTEXTO:\n";
        $prompt .= json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        // Conhecimento RAG
        if (!empty($ragResults)) {
            $prompt .= "\n\nCONHECIMENTO RELEVANTE DA BASE:\n";
            foreach ($ragResults as $result) {
                $prompt .= "- [{$result['category']}] {$result['content']}\n";
            }
        }

        return $prompt;
    }

    private function formatMessages(string $system, string $user): array
    {
        return [
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ],
            'temperature' => 0.3,
            'max_tokens' => 2000,
        ];
    }
}
