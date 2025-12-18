<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Odontogram;
use App\Models\OdontogramHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OdontogramController extends Controller
{
    public function show(string $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        
        $odontogram = Odontogram::firstOrCreate(
            ['patient_id' => $patientId],
            ['teeth_data' => [], 'type' => 'permanent']
        );

        return response()->json([
            'data' => [
                'id' => $odontogram->id,
                'patient_id' => $odontogram->patient_id,
                'teeth_data' => $odontogram->teeth_data ?? [],
                'type' => $odontogram->type,
                'updated_at' => $odontogram->updated_at,
            ]
        ]);
    }

    public function update(Request $request, string $patientId): JsonResponse
    {
        $request->validate([
            'teeth_data' => 'required|array',
            'type' => 'sometimes|in:permanent,deciduous',
        ]);

        $odontogram = Odontogram::firstOrCreate(
            ['patient_id' => $patientId],
            ['teeth_data' => [], 'type' => 'permanent']
        );

        $odontogram->update([
            'teeth_data' => $request->teeth_data,
            'type' => $request->type ?? $odontogram->type,
        ]);

        return response()->json([
            'message' => 'Odontograma atualizado com sucesso',
            'data' => $odontogram,
        ]);
    }

    public function updateTooth(Request $request, string $patientId, string $toothNumber): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:healthy,cavity,restoration,extraction,implant,crown,root_canal,missing',
            'surfaces' => 'sometimes|array',
            'notes' => 'sometimes|string|nullable',
            'procedures' => 'sometimes|array',
        ]);

        $odontogram = Odontogram::firstOrCreate(
            ['patient_id' => $patientId],
            ['teeth_data' => [], 'type' => 'permanent']
        );

        $teethData = $odontogram->teeth_data ?? [];
        $previousData = $teethData[$toothNumber] ?? null;

        // Atualizar dados do dente
        $teethData[$toothNumber] = [
            'status' => $request->status,
            'surfaces' => $request->surfaces ?? [],
            'notes' => $request->notes,
            'procedures' => $request->procedures ?? [],
        ];

        $odontogram->update(['teeth_data' => $teethData]);

        // Registrar histórico
        OdontogramHistory::create([
            'odontogram_id' => $odontogram->id,
            'tooth_number' => $toothNumber,
            'previous_data' => $previousData,
            'new_data' => $teethData[$toothNumber],
            'change_type' => $previousData ? 'update' : 'create',
            'changed_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Dente atualizado com sucesso',
            'data' => $teethData[$toothNumber],
        ]);
    }

    public function history(string $patientId): JsonResponse
    {
        $odontogram = Odontogram::where('patient_id', $patientId)->first();
        
        if (!$odontogram) {
            return response()->json(['data' => []]);
        }

        $history = OdontogramHistory::where('odontogram_id', $odontogram->id)
            ->with('changedBy:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['data' => $history]);
    }

    public function aiAnalysis(string $patientId): JsonResponse
    {
        $odontogram = Odontogram::where('patient_id', $patientId)->first();
        
        if (!$odontogram || empty($odontogram->teeth_data)) {
            return response()->json([
                'data' => [
                    'suggestions' => [],
                    'risk_areas' => [],
                    'treatment_priority' => [],
                ]
            ]);
        }

        $teethData = $odontogram->teeth_data;
        $suggestions = [];
        $riskAreas = [];
        $treatmentPriority = [];

        // Análise simples baseada em regras
        foreach ($teethData as $tooth => $data) {
            $status = $data['status'] ?? 'healthy';
            
            if ($status === 'cavity') {
                $treatmentPriority[] = [
                    'tooth' => $tooth,
                    'priority' => 'high',
                    'suggestion' => "Dente $tooth necessita tratamento de cárie",
                ];
            }
            
            if ($status === 'root_canal') {
                $suggestions[] = "Considerar coroa protetora para dente $tooth após tratamento de canal";
            }
        }

        // Detectar padrões
        $cavityCount = count(array_filter($teethData, fn($d) => ($d['status'] ?? '') === 'cavity'));
        if ($cavityCount >= 3) {
            $riskAreas[] = [
                'type' => 'multiple_cavities',
                'message' => 'Paciente apresenta múltiplas cáries. Avaliar higiene bucal e dieta.',
            ];
        }

        return response()->json([
            'data' => [
                'suggestions' => $suggestions,
                'risk_areas' => $riskAreas,
                'treatment_priority' => $treatmentPriority,
            ]
        ]);
    }
}
