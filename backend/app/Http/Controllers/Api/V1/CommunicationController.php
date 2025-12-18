<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\CommunicationLog;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CommunicationController extends Controller
{
    /**
     * Listar templates de mensagem
     */
    public function templates(Request $request): JsonResponse
    {
        $templates = MessageTemplate::when($request->type, function ($q, $type) {
            $q->where('type', $type);
        })->orderBy('name')->get();

        return response()->json(['data' => $templates]);
    }

    /**
     * Criar template
     */
    public function createTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:reminder,confirmation,post_treatment,reactivation,birthday,custom',
            'channel' => 'required|in:whatsapp,sms,email',
            'subject' => 'nullable|string|max:200',
            'content' => 'required|string|max:1000',
            'variables' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $template = MessageTemplate::create($validated);

        return response()->json([
            'data' => $template,
            'message' => 'Template criado com sucesso',
        ], 201);
    }

    /**
     * Atualizar template
     */
    public function updateTemplate(Request $request, string $id): JsonResponse
    {
        $template = MessageTemplate::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'content' => 'sometimes|string|max:1000',
            'subject' => 'nullable|string|max:200',
            'is_active' => 'nullable|boolean',
        ]);

        $template->update($validated);

        return response()->json([
            'data' => $template,
            'message' => 'Template atualizado com sucesso',
        ]);
    }

    /**
     * Enviar mensagem individual
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'channel' => 'required|in:whatsapp,sms,email',
            'template_id' => 'nullable|uuid',
            'message' => 'required_without:template_id|string',
            'subject' => 'nullable|string',
            'appointment_id' => 'nullable|uuid',
            'custom_data' => 'nullable|array',
        ]);

        $patient = Patient::findOrFail($validated['patient_id']);
        
        // Obter mensagem do template ou usar mensagem customizada
        $message = $validated['message'] ?? '';
        $subject = $validated['subject'] ?? '';
        
        if (isset($validated['template_id'])) {
            $template = MessageTemplate::findOrFail($validated['template_id']);
            $message = $this->parseTemplate($template->content, $patient, $validated['custom_data'] ?? []);
            $subject = $template->subject ?? '';
        } else {
            $message = $this->parseTemplate($message, $patient, $validated['custom_data'] ?? []);
        }

        // Enviar mensagem
        $result = $this->sendMessage(
            $validated['channel'],
            $patient,
            $message,
            $subject
        );

        // Registrar log
        CommunicationLog::create([
            'patient_id' => $patient->id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'channel' => $validated['channel'],
            'type' => $validated['template_id'] ? 'template' : 'custom',
            'template_id' => $validated['template_id'] ?? null,
            'content' => $message,
            'status' => $result['success'] ? 'sent' : 'failed',
            'external_id' => $result['external_id'] ?? null,
            'error_message' => $result['error'] ?? null,
            'sent_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagem',
            'error' => $result['error'] ?? null,
        ]);
    }

    /**
     * Enviar mensagens em massa
     */
    public function sendBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_ids' => 'required|array|min:1',
            'patient_ids.*' => 'uuid|exists:patients,id',
            'channel' => 'required|in:whatsapp,sms,email',
            'template_id' => 'required|uuid|exists:message_templates,id',
            'custom_data' => 'nullable|array',
        ]);

        $template = MessageTemplate::findOrFail($validated['template_id']);
        $results = ['sent' => 0, 'failed' => 0, 'errors' => []];

        foreach ($validated['patient_ids'] as $patientId) {
            $patient = Patient::find($patientId);
            if (!$patient) continue;

            $message = $this->parseTemplate($template->content, $patient, $validated['custom_data'] ?? []);
            $result = $this->sendMessage($validated['channel'], $patient, $message, $template->subject);

            CommunicationLog::create([
                'patient_id' => $patient->id,
                'channel' => $validated['channel'],
                'type' => 'bulk',
                'template_id' => $template->id,
                'content' => $message,
                'status' => $result['success'] ? 'sent' : 'failed',
                'sent_by' => auth()->id(),
            ]);

            if ($result['success']) {
                $results['sent']++;
            } else {
                $results['failed']++;
                $results['errors'][] = ['patient_id' => $patientId, 'error' => $result['error']];
            }
        }

        return response()->json([
            'message' => "Enviadas: {$results['sent']}, Falhas: {$results['failed']}",
            'data' => $results,
        ]);
    }

    /**
     * Histórico de comunicações
     */
    public function history(Request $request): JsonResponse
    {
        $query = CommunicationLog::with(['patient:id,name', 'template:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->channel) {
            $query->where('channel', $request->channel);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $logs = $query->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }

    /**
     * Webhook WhatsApp (receber respostas)
     */
    public function whatsappWebhook(Request $request): JsonResponse
    {
        $data = $request->all();
        
        // Processar resposta do paciente
        if (isset($data['messages'])) {
            foreach ($data['messages'] as $message) {
                $phone = $message['from'] ?? null;
                $text = $message['text']['body'] ?? '';
                
                // Buscar paciente pelo telefone
                $patient = Patient::where('whatsapp', $phone)
                    ->orWhere('phone', $phone)
                    ->first();

                if ($patient && $this->isConfirmationResponse($text)) {
                    // Confirmar próximo agendamento
                    $appointment = Appointment::where('patient_id', $patient->id)
                        ->where('status', 'scheduled')
                        ->where('start_time', '>', now())
                        ->orderBy('start_time')
                        ->first();

                    if ($appointment) {
                        $appointment->update([
                            'status' => 'confirmed',
                            'confirmed_at' => now(),
                            'confirmed_via' => 'whatsapp',
                        ]);
                    }
                }

                // Registrar resposta
                CommunicationLog::create([
                    'patient_id' => $patient?->id,
                    'channel' => 'whatsapp',
                    'type' => 'incoming',
                    'content' => $text,
                    'status' => 'received',
                    'external_id' => $message['id'] ?? null,
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Webhook SMS
     */
    public function smsWebhook(Request $request): JsonResponse
    {
        // Similar ao WhatsApp webhook
        return response()->json(['status' => 'ok']);
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    private function parseTemplate(string $content, Patient $patient, array $customData = []): string
    {
        $firstName = explode(' ', $patient->name)[0];
        
        $replacements = [
            '{nome}' => $patient->name,
            '{primeiro_nome}' => $firstName,
            '{email}' => $patient->email ?? '',
            '{telefone}' => $patient->phone ?? '',
            ...$customData,
        ];

        foreach ($replacements as $key => $value) {
            $content = str_replace($key, $value, $content);
        }

        return $content;
    }

    private function sendMessage(string $channel, Patient $patient, string $message, ?string $subject = null): array
    {
        switch ($channel) {
            case 'whatsapp':
                return $this->sendWhatsApp($patient->whatsapp ?? $patient->phone, $message);
            case 'sms':
                return $this->sendSMS($patient->phone, $message);
            case 'email':
                return $this->sendEmail($patient->email, $subject ?? 'OdontoFlow', $message);
            default:
                return ['success' => false, 'error' => 'Canal não suportado'];
        }
    }

    private function sendWhatsApp(string $phone, string $message): array
    {
        // Integração com WhatsApp Business API
        $apiKey = config('services.whatsapp.api_key');
        $phoneId = config('services.whatsapp.phone_id');

        if (!$apiKey || !$phoneId) {
            // Simular envio em desenvolvimento
            return ['success' => true, 'external_id' => 'sim_' . uniqid()];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer $apiKey",
                'Content-Type' => 'application/json',
            ])->post("https://graph.facebook.com/v17.0/$phoneId/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $this->formatPhone($phone),
                'type' => 'text',
                'text' => ['body' => $message],
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'external_id' => $response->json('messages.0.id'),
                ];
            }

            return ['success' => false, 'error' => $response->body()];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendSMS(string $phone, string $message): array
    {
        // Integração com provedor de SMS (ex: Twilio, Zenvia)
        // Simular em desenvolvimento
        return ['success' => true, 'external_id' => 'sms_' . uniqid()];
    }

    private function sendEmail(string $email, string $subject, string $message): array
    {
        if (!$email) {
            return ['success' => false, 'error' => 'Email não cadastrado'];
        }

        try {
            // Em produção, usar Mail facade do Laravel
            // Mail::to($email)->send(new GenericMessage($subject, $message));
            return ['success' => true, 'external_id' => 'email_' . uniqid()];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function formatPhone(string $phone): string
    {
        // Remover caracteres não numéricos
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Adicionar código do país se não tiver
        if (strlen($phone) === 11) {
            $phone = '55' . $phone;
        }
        
        return $phone;
    }

    private function isConfirmationResponse(string $text): bool
    {
        $text = strtolower(trim($text));
        $confirmations = ['sim', 'confirmo', 'ok', 'confirmado', 's', '1', 'yes'];
        
        return in_array($text, $confirmations);
    }
}
