<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\MedicalRecord;
use App\Models\AIInteraction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /**
     * Gera evolução clínica baseada em resumo do dentista
     */
    public function generateEvolution(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'summary' => 'required|string|min:10',
            'procedures' => 'sometimes|array',
            'appointment_id' => 'sometimes|uuid',
        ]);

        $patient = Patient::with(['odontogram'])->findOrFail($request->patient_id);
        
        // Construir contexto para a IA
        $context = $this->buildPatientContext($patient);
        
        // Prompt estruturado para geração de evolução
        $prompt = $this->buildEvolutionPrompt($request->summary, $context, $request->procedures ?? []);
        
        // Chamar OpenAI (ou simular resposta)
        $aiResponse = $this->callAI($prompt, 'evolution');
        
        // Registrar interação
        $interaction = AIInteraction::create([
            'user_id' => auth()->id(),
            'context_type' => 'evolution',
            'context_data' => [
                'patient_id' => $patient->id,
                'summary' => $request->summary,
            ],
            'prompt' => $prompt,
            'model' => 'gpt-4',
            'response' => $aiResponse['content'],
            'tokens_used' => $aiResponse['tokens'] ?? 0,
        ]);

        return response()->json([
            'data' => [
                'evolution' => $aiResponse['content'],
                'interaction_id' => $interaction->id,
                'suggestions' => $aiResponse['suggestions'] ?? [],
            ]
        ]);
    }

    /**
     * Sugere diagnósticos baseado em sintomas
     */
    public function suggestDiagnosis(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'symptoms' => 'required|array|min:1',
            'affected_teeth' => 'sometimes|array',
            'clinical_exam' => 'sometimes|string',
        ]);

        $patient = Patient::findOrFail($request->patient_id);
        
        $prompt = $this->buildDiagnosisPrompt(
            $request->symptoms,
            $request->affected_teeth ?? [],
            $request->clinical_exam ?? ''
        );
        
        $aiResponse = $this->callAI($prompt, 'diagnosis');
        
        AIInteraction::create([
            'user_id' => auth()->id(),
            'context_type' => 'diagnosis',
            'context_data' => $request->all(),
            'prompt' => $prompt,
            'model' => 'gpt-4',
            'response' => json_encode($aiResponse['diagnoses'] ?? []),
        ]);

        return response()->json([
            'data' => [
                'diagnoses' => $aiResponse['diagnoses'] ?? [],
                'confidence' => $aiResponse['confidence'] ?? 0.8,
                'recommendations' => $aiResponse['recommendations'] ?? [],
            ]
        ]);
    }

    /**
     * Sugere plano de tratamento
     */
    public function suggestTreatment(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'diagnosis' => 'required|string',
            'affected_teeth' => 'sometimes|array',
        ]);

        $patient = Patient::with(['odontogram'])->findOrFail($request->patient_id);
        
        $prompt = $this->buildTreatmentPrompt(
            $request->diagnosis,
            $request->affected_teeth ?? [],
            $patient
        );
        
        $aiResponse = $this->callAI($prompt, 'treatment');

        return response()->json([
            'data' => [
                'treatment_plan' => $aiResponse['treatment_plan'] ?? [],
                'estimated_sessions' => $aiResponse['sessions'] ?? 1,
                'priority' => $aiResponse['priority'] ?? 'medium',
                'estimated_cost' => $aiResponse['cost'] ?? null,
            ]
        ]);
    }

    /**
     * Chat conversacional com IA
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'sometimes|uuid',
            'context' => 'sometimes|array',
        ]);

        $prompt = "Você é um assistente especializado em odontologia. Responda de forma profissional e técnica.\n\n";
        $prompt .= "Pergunta: " . $request->message;
        
        if ($request->context) {
            $prompt .= "\n\nContexto adicional: " . json_encode($request->context);
        }
        
        $aiResponse = $this->callAI($prompt, 'chat');

        return response()->json([
            'data' => [
                'response' => $aiResponse['content'],
                'conversation_id' => $request->conversation_id ?? null,
            ]
        ]);
    }

    /**
     * Analisa risco de no-show
     */
    public function analyzeNoShowRisk(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
        ]);

        $patient = Patient::findOrFail($request->patient_id);
        
        // Calcular score baseado em histórico
        $riskScore = $this->calculateNoShowRisk($patient, $request->appointment_date, $request->appointment_time);

        return response()->json([
            'data' => [
                'risk_score' => $riskScore,
                'risk_level' => $riskScore > 0.7 ? 'high' : ($riskScore > 0.4 ? 'medium' : 'low'),
                'factors' => $this->getNoShowFactors($patient),
                'recommendations' => $this->getNoShowRecommendations($riskScore),
            ]
        ]);
    }

    /**
     * Insights financeiros
     */
    public function financialInsights(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month');
        
        // Simular insights (em produção, usar dados reais)
        $insights = [
            'abandoned_treatments' => [
                'count' => 12,
                'potential_revenue' => 8500.00,
                'patients' => [],
            ],
            'inactive_patients' => [
                'count' => 45,
                'potential_revenue' => 15000.00,
            ],
            'recurring_issues' => [
                ['type' => 'Retratamento de canal', 'count' => 3, 'loss' => 1200.00],
            ],
            'opportunities' => [
                'Pacientes com tratamento pendente há mais de 30 dias',
                'Pacientes que não retornaram para revisão semestral',
            ],
        ];

        return response()->json(['data' => $insights]);
    }

    /**
     * Gera mensagem personalizada
     */
    public function generateMessage(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:reminder,confirmation,post_treatment,reactivation,birthday',
            'patient_id' => 'required|uuid|exists:patients,id',
            'appointment_id' => 'sometimes|uuid',
            'custom_data' => 'sometimes|array',
        ]);

        $patient = Patient::findOrFail($request->patient_id);
        
        $message = $this->generatePatientMessage(
            $request->type,
            $patient,
            $request->custom_data ?? []
        );

        return response()->json([
            'data' => [
                'message' => $message,
                'channels' => ['whatsapp', 'sms', 'email'],
            ]
        ]);
    }

    /**
     * Feedback sobre resposta da IA
     */
    public function feedback(Request $request): JsonResponse
    {
        $request->validate([
            'interaction_id' => 'required|uuid',
            'was_accepted' => 'required|boolean',
            'was_edited' => 'sometimes|boolean',
            'feedback' => 'sometimes|in:positive,negative,neutral',
            'notes' => 'sometimes|string',
        ]);

        $interaction = AIInteraction::findOrFail($request->interaction_id);
        
        $interaction->update([
            'was_accepted' => $request->was_accepted,
            'was_edited' => $request->was_edited ?? false,
            'user_feedback' => $request->feedback ?? null,
            'feedback_notes' => $request->notes ?? null,
        ]);

        return response()->json([
            'message' => 'Feedback registrado com sucesso',
        ]);
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    private function buildPatientContext(Patient $patient): array
    {
        return [
            'name' => $patient->name,
            'age' => $patient->birth_date ? now()->diffInYears($patient->birth_date) : null,
            'gender' => $patient->gender,
            'last_visit' => $patient->last_visit_at,
            'risk_score' => $patient->risk_score,
        ];
    }

    private function buildEvolutionPrompt(string $summary, array $context, array $procedures): string
    {
        $prompt = "Gere uma evolução clínica odontológica profissional baseada no seguinte resumo:\n\n";
        $prompt .= "RESUMO DO ATENDIMENTO:\n$summary\n\n";
        
        if (!empty($procedures)) {
            $prompt .= "PROCEDIMENTOS REALIZADOS:\n" . implode(", ", $procedures) . "\n\n";
        }
        
        $prompt .= "CONTEXTO DO PACIENTE:\n" . json_encode($context) . "\n\n";
        $prompt .= "Formate a evolução com: Queixa Principal, Exame Clínico, Diagnóstico, Procedimentos, Orientações.";
        
        return $prompt;
    }

    private function buildDiagnosisPrompt(array $symptoms, array $teeth, string $exam): string
    {
        $prompt = "Com base nos seguintes dados clínicos, sugira possíveis diagnósticos odontológicos:\n\n";
        $prompt .= "SINTOMAS: " . implode(", ", $symptoms) . "\n";
        
        if (!empty($teeth)) {
            $prompt .= "DENTES AFETADOS: " . implode(", ", $teeth) . "\n";
        }
        
        if ($exam) {
            $prompt .= "EXAME CLÍNICO: $exam\n";
        }
        
        $prompt .= "\nListe os diagnósticos em ordem de probabilidade com CID quando aplicável.";
        
        return $prompt;
    }

    private function buildTreatmentPrompt(string $diagnosis, array $teeth, Patient $patient): string
    {
        $prompt = "Sugira um plano de tratamento para:\n\n";
        $prompt .= "DIAGNÓSTICO: $diagnosis\n";
        
        if (!empty($teeth)) {
            $prompt .= "DENTES: " . implode(", ", $teeth) . "\n";
        }
        
        $prompt .= "\nInclua: procedimentos necessários, número de sessões, prioridade e ordem de execução.";
        
        return $prompt;
    }

    private function callAI(string $prompt, string $type): array
    {
        // Em produção, chamar OpenAI API
        // Por enquanto, retornar resposta simulada
        
        $apiKey = config('ai.openai_key');
        
        if ($apiKey && $apiKey !== 'sk-your-api-key-here') {
            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer $apiKey",
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é um assistente odontológico especializado.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 1000,
                ]);
                
                if ($response->successful()) {
                    $data = $response->json();
                    return [
                        'content' => $data['choices'][0]['message']['content'] ?? '',
                        'tokens' => $data['usage']['total_tokens'] ?? 0,
                    ];
                }
            } catch (\Exception $e) {
                // Log error and fall through to simulated response
            }
        }
        
        // Resposta simulada para desenvolvimento
        return $this->getSimulatedResponse($type);
    }

    private function getSimulatedResponse(string $type): array
    {
        $responses = [
            'evolution' => [
                'content' => "**EVOLUÇÃO CLÍNICA**\n\n" .
                    "**Queixa Principal:** Paciente compareceu para consulta de rotina.\n\n" .
                    "**Exame Clínico:** Mucosas normocoradas, higiene bucal satisfatória. " .
                    "Ausência de lesões em tecidos moles.\n\n" .
                    "**Diagnóstico:** Saúde bucal preservada.\n\n" .
                    "**Procedimentos:** Profilaxia dental, aplicação tópica de flúor.\n\n" .
                    "**Orientações:** Manter escovação 3x ao dia, uso de fio dental diário. " .
                    "Retorno em 6 meses para revisão.",
                'suggestions' => [
                    'Considerar radiografia panorâmica se não realizada há mais de 1 ano',
                    'Avaliar necessidade de clareamento dental',
                ],
            ],
            'diagnosis' => [
                'diagnoses' => [
                    ['name' => 'Cárie dentária (K02)', 'probability' => 0.85],
                    ['name' => 'Pulpite reversível (K04.0)', 'probability' => 0.60],
                ],
                'confidence' => 0.85,
                'recommendations' => [
                    'Realizar teste de vitalidade pulpar',
                    'Radiografia periapical do dente afetado',
                ],
            ],
            'treatment' => [
                'treatment_plan' => [
                    ['step' => 1, 'procedure' => 'Anestesia local', 'session' => 1],
                    ['step' => 2, 'procedure' => 'Remoção de tecido cariado', 'session' => 1],
                    ['step' => 3, 'procedure' => 'Restauração em resina composta', 'session' => 1],
                ],
                'sessions' => 1,
                'priority' => 'medium',
                'cost' => 250.00,
            ],
            'chat' => [
                'content' => 'Como assistente odontológico, posso ajudá-lo com dúvidas sobre procedimentos, ' .
                    'diagnósticos e tratamentos. Como posso auxiliar?',
            ],
        ];
        
        return $responses[$type] ?? ['content' => 'Resposta não disponível'];
    }

    private function calculateNoShowRisk(Patient $patient, string $date, string $time): float
    {
        $baseRisk = 1 - ($patient->attendance_score ?? 1.0);
        
        // Ajustar por dia da semana (segunda-feira tem mais faltas)
        $dayOfWeek = date('N', strtotime($date));
        if ($dayOfWeek == 1) $baseRisk += 0.1;
        
        // Ajustar por horário (início da manhã e fim da tarde têm mais faltas)
        $hour = (int) substr($time, 0, 2);
        if ($hour < 9 || $hour > 17) $baseRisk += 0.1;
        
        return min(1.0, max(0.0, $baseRisk));
    }

    private function getNoShowFactors(Patient $patient): array
    {
        $factors = [];
        
        if (($patient->attendance_score ?? 1) < 0.7) {
            $factors[] = 'Histórico de faltas anteriores';
        }
        
        if (!$patient->whatsapp) {
            $factors[] = 'Sem WhatsApp cadastrado para lembretes';
        }
        
        return $factors;
    }

    private function getNoShowRecommendations(float $riskScore): array
    {
        if ($riskScore > 0.7) {
            return [
                'Enviar lembrete 48h antes',
                'Confirmar por telefone 24h antes',
                'Considerar overbooking neste horário',
            ];
        }
        
        if ($riskScore > 0.4) {
            return [
                'Enviar lembrete padrão 24h antes',
                'Solicitar confirmação por WhatsApp',
            ];
        }
        
        return ['Enviar lembrete padrão'];
    }

    private function generatePatientMessage(string $type, Patient $patient, array $data): string
    {
        $firstName = explode(' ', $patient->name)[0];
        
        $messages = [
            'reminder' => "Olá, $firstName! 😊\n\nLembramos que você tem consulta agendada amanhã às {hora}.\n\nConfirme sua presença respondendo SIM.\n\nOdontoFlow",
            'confirmation' => "Olá, $firstName!\n\nSua consulta está confirmada para {data} às {hora}.\n\nEndereço: {endereco}\n\nAté lá! 🦷",
            'post_treatment' => "Olá, $firstName!\n\nEsperamos que esteja bem após o procedimento de hoje.\n\nLembre-se das orientações:\n- Evitar alimentos duros por 24h\n- Tomar a medicação prescrita\n\nQualquer dúvida, estamos à disposição!",
            'reactivation' => "Olá, $firstName! 👋\n\nSentimos sua falta! Faz tempo que não nos vemos.\n\nQue tal agendar uma consulta de revisão? Sua saúde bucal é importante!\n\nAgende pelo link: {link}",
            'birthday' => "Feliz aniversário, $firstName! 🎂🎉\n\nA equipe OdontoFlow deseja um dia maravilhoso!\n\nComo presente, você tem 10% de desconto em qualquer procedimento este mês.",
        ];
        
        $message = $messages[$type] ?? "Olá, $firstName!";
        
        // Substituir placeholders
        foreach ($data as $key => $value) {
            $message = str_replace("{{$key}}", $value, $message);
        }
        
        return $message;
    }
}
