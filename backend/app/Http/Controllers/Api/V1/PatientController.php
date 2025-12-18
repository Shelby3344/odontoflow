<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        if ($request->has('q')) {
            $query->search($request->q);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);

        $total = $query->count();
        $patients = $query->orderBy('name')
            ->skip($offset)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $patients->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'email' => $p->email,
                'phone' => $p->phone,
                'birth_date' => $p->birth_date?->format('Y-m-d'),
                'age' => $p->age,
                'status' => $p->status,
                'last_visit_at' => $p->last_visit_at?->toIso8601String(),
                'metrics' => [
                    'attendance_score' => (float) $p->attendance_score,
                    'risk_score' => (float) $p->risk_score,
                ],
            ]),
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'document' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'whatsapp' => 'nullable|string|max:20',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_complement' => 'nullable|string|max:100',
            'address_neighborhood' => 'nullable|string|max:100',
            'address_city' => 'nullable|string|max:100',
            'address_state' => 'nullable|string|max:2',
            'address_zipcode' => 'nullable|string|max:10',
        ]);

        $patient = Patient::create($validated);

        return response()->json([
            'data' => $patient,
            'message' => 'Paciente criado com sucesso',
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'document' => $patient->document,
                'birth_date' => $patient->birth_date?->format('Y-m-d'),
                'age' => $patient->age,
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'whatsapp' => $patient->whatsapp,
                'address' => [
                    'street' => $patient->address_street,
                    'number' => $patient->address_number,
                    'complement' => $patient->address_complement,
                    'neighborhood' => $patient->address_neighborhood,
                    'city' => $patient->address_city,
                    'state' => $patient->address_state,
                    'zipcode' => $patient->address_zipcode,
                ],
                'status' => $patient->status,
                'metrics' => [
                    'attendance_score' => (float) $patient->attendance_score,
                    'engagement_score' => (float) $patient->engagement_score,
                    'risk_score' => (float) $patient->risk_score,
                ],
                'first_visit_at' => $patient->first_visit_at?->toIso8601String(),
                'last_visit_at' => $patient->last_visit_at?->toIso8601String(),
                'created_at' => $patient->created_at->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'whatsapp' => 'sometimes|nullable|string|max:20',
        ]);

        $patient->update($validated);

        return response()->json([
            'data' => $patient,
            'message' => 'Paciente atualizado com sucesso',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $patient->update(['status' => 'inactive']);

        return response()->json([
            'message' => 'Paciente desativado com sucesso',
        ]);
    }

    public function atRisk(): JsonResponse
    {
        $patients = Patient::where('risk_score', '>=', 0.6)
            ->where('status', 'active')
            ->orderByDesc('risk_score')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $patients->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'phone' => $p->phone,
                'risk_score' => (float) $p->risk_score,
                'last_visit_at' => $p->last_visit_at?->toIso8601String(),
            ]),
        ]);
    }

    public function inactive(Request $request): JsonResponse
    {
        $days = $request->get('days', 90);
        
        $patients = Patient::where('status', 'active')
            ->where('last_visit_at', '<', now()->subDays($days))
            ->orderBy('last_visit_at')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $patients->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'phone' => $p->phone,
                'last_visit_at' => $p->last_visit_at?->toIso8601String(),
            ]),
        ]);
    }

    public function birthdays(): JsonResponse
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        $patients = Patient::where('status', 'active')
            ->whereRaw("strftime('%m-%d', birth_date) BETWEEN ? AND ?", [
                $startOfWeek->format('m-d'),
                $endOfWeek->format('m-d'),
            ])
            ->get();

        return response()->json([
            'data' => $patients->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'birth_date' => $p->birth_date?->format('Y-m-d'),
                'phone' => $p->phone,
                'whatsapp' => $p->whatsapp,
            ]),
        ]);
    }
}
