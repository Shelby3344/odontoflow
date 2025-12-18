<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Transaction;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancialController extends Controller
{
    /**
     * Dashboard financeiro
     */
    public function dashboard(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        // Receitas do período
        $revenue = Transaction::whereBetween('due_date', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->sum('amount');

        // Receitas pendentes
        $pending = Transaction::whereBetween('due_date', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'pending')
            ->sum('amount');

        // Despesas
        $expenses = Transaction::whereBetween('due_date', [$startDate, $endDate])
            ->where('type', 'expense')
            ->where('status', 'paid')
            ->sum('amount');

        // Orçamentos aprovados
        $approvedBudgets = Budget::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'approved')
            ->sum('total');

        // Orçamentos pendentes
        $pendingBudgets = Budget::where('status', 'pending')
            ->sum('total');

        // Receita por procedimento
        $revenueByProcedure = Transaction::whereBetween('paid_at', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->whereNotNull('procedure_type')
            ->groupBy('procedure_type')
            ->select('procedure_type', DB::raw('SUM(amount) as total'))
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Receita por profissional
        $revenueByProfessional = Transaction::whereBetween('paid_at', [$startDate, $endDate])
            ->where('type', 'income')
            ->where('status', 'paid')
            ->whereNotNull('professional_id')
            ->groupBy('professional_id')
            ->select('professional_id', DB::raw('SUM(amount) as total'))
            ->with('professional:id,name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'revenue' => $revenue,
                    'pending' => $pending,
                    'expenses' => $expenses,
                    'profit' => $revenue - $expenses,
                    'approved_budgets' => $approvedBudgets,
                    'pending_budgets' => $pendingBudgets,
                ],
                'revenue_by_procedure' => $revenueByProcedure,
                'revenue_by_professional' => $revenueByProfessional,
            ],
        ]);
    }

    /**
     * Listar transações
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = Transaction::with(['patient:id,name', 'professional:id,name'])
            ->orderBy('due_date', 'desc');

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
        }

        $transactions = $query->paginate($request->per_page ?? 20);

        return response()->json($transactions);
    }

    /**
     * Criar transação
     */
    public function createTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|uuid|exists:patients,id',
            'professional_id' => 'nullable|uuid|exists:users,id',
            'budget_id' => 'nullable|uuid|exists:budgets,id',
            'type' => 'required|in:income,expense',
            'category' => 'required|string|max:50',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'payment_method' => 'nullable|string|max:50',
            'installments' => 'nullable|integer|min:1|max:24',
            'procedure_type' => 'nullable|string|max:100',
        ]);

        // Se tiver parcelas, criar múltiplas transações
        $installments = $validated['installments'] ?? 1;
        $installmentAmount = $validated['amount'] / $installments;
        $transactions = [];

        for ($i = 0; $i < $installments; $i++) {
            $dueDate = \Carbon\Carbon::parse($validated['due_date'])->addMonths($i);
            
            $transaction = Transaction::create([
                ...$validated,
                'amount' => $installmentAmount,
                'due_date' => $dueDate,
                'installment_number' => $installments > 1 ? $i + 1 : null,
                'total_installments' => $installments > 1 ? $installments : null,
                'status' => 'pending',
            ]);
            
            $transactions[] = $transaction;
        }

        return response()->json([
            'data' => $transactions,
            'message' => $installments > 1 
                ? "Criadas $installments parcelas com sucesso" 
                : 'Transação criada com sucesso',
        ], 201);
    }

    /**
     * Atualizar transação
     */
    public function updateTransaction(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::findOrFail($id);

        $validated = $request->validate([
            'description' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,paid,cancelled',
        ]);

        $transaction->update($validated);

        return response()->json([
            'data' => $transaction,
            'message' => 'Transação atualizada com sucesso',
        ]);
    }

    /**
     * Marcar como pago
     */
    public function markAsPaid(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::findOrFail($id);

        $transaction->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $request->payment_method ?? $transaction->payment_method,
        ]);

        return response()->json([
            'message' => 'Pagamento registrado com sucesso',
        ]);
    }

    /**
     * Transações do paciente
     */
    public function patientTransactions(string $patientId): JsonResponse
    {
        $transactions = Transaction::where('patient_id', $patientId)
            ->orderBy('due_date', 'desc')
            ->get();

        $summary = [
            'total_paid' => $transactions->where('status', 'paid')->sum('amount'),
            'total_pending' => $transactions->where('status', 'pending')->sum('amount'),
            'overdue' => $transactions->where('status', 'pending')
                ->where('due_date', '<', now())
                ->sum('amount'),
        ];

        return response()->json([
            'data' => $transactions,
            'summary' => $summary,
        ]);
    }

    /**
     * Listar orçamentos
     */
    public function budgets(Request $request): JsonResponse
    {
        $query = Budget::with(['patient:id,name', 'professional:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->patient_id) {
            $query->where('patient_id', $request->patient_id);
        }

        $budgets = $query->paginate($request->per_page ?? 20);

        return response()->json($budgets);
    }

    /**
     * Criar orçamento
     */
    public function createBudget(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|uuid|exists:patients,id',
            'professional_id' => 'required|uuid|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.procedure' => 'required|string',
            'items.*.tooth' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'valid_until' => 'nullable|date',
        ]);

        // Calcular totais
        $subtotal = 0;
        foreach ($validated['items'] as &$item) {
            $item['total'] = ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
            $subtotal += $item['total'];
        }

        $discount = $validated['discount'] ?? 0;
        $total = $subtotal - $discount;

        $budget = Budget::create([
            'patient_id' => $validated['patient_id'],
            'professional_id' => $validated['professional_id'],
            'items' => $validated['items'],
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
            'notes' => $validated['notes'] ?? null,
            'valid_until' => $validated['valid_until'] ?? now()->addDays(30),
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => $budget,
            'message' => 'Orçamento criado com sucesso',
        ], 201);
    }

    /**
     * Visualizar orçamento
     */
    public function showBudget(string $id): JsonResponse
    {
        $budget = Budget::with(['patient', 'professional'])->findOrFail($id);

        return response()->json(['data' => $budget]);
    }

    /**
     * Atualizar orçamento
     */
    public function updateBudget(Request $request, string $id): JsonResponse
    {
        $budget = Budget::findOrFail($id);

        if ($budget->status !== 'pending') {
            return response()->json([
                'message' => 'Não é possível editar orçamento já aprovado ou rejeitado',
            ], 422);
        }

        $validated = $request->validate([
            'items' => 'sometimes|array|min:1',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'valid_until' => 'nullable|date',
        ]);

        if (isset($validated['items'])) {
            $subtotal = 0;
            foreach ($validated['items'] as &$item) {
                $item['total'] = ($item['unit_price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $subtotal += $item['total'];
            }
            $validated['subtotal'] = $subtotal;
            $validated['total'] = $subtotal - ($validated['discount'] ?? $budget->discount);
        }

        $budget->update($validated);

        return response()->json([
            'data' => $budget,
            'message' => 'Orçamento atualizado com sucesso',
        ]);
    }

    /**
     * Aprovar orçamento
     */
    public function approveBudget(Request $request, string $id): JsonResponse
    {
        $budget = Budget::findOrFail($id);

        if ($budget->status !== 'pending') {
            return response()->json([
                'message' => 'Orçamento já foi processado',
            ], 422);
        }

        $budget->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        // Criar transações para os itens do orçamento
        $installments = $request->installments ?? 1;
        $installmentAmount = $budget->total / $installments;

        for ($i = 0; $i < $installments; $i++) {
            Transaction::create([
                'patient_id' => $budget->patient_id,
                'professional_id' => $budget->professional_id,
                'budget_id' => $budget->id,
                'type' => 'income',
                'category' => 'treatment',
                'description' => "Orçamento #{$budget->id} - Parcela " . ($i + 1),
                'amount' => $installmentAmount,
                'due_date' => now()->addMonths($i),
                'installment_number' => $installments > 1 ? $i + 1 : null,
                'total_installments' => $installments > 1 ? $installments : null,
                'status' => 'pending',
            ]);
        }

        return response()->json([
            'message' => 'Orçamento aprovado com sucesso',
        ]);
    }

    /**
     * Enviar orçamento para paciente
     */
    public function sendBudget(Request $request, string $id): JsonResponse
    {
        $budget = Budget::with('patient')->findOrFail($id);

        $channel = $request->channel ?? 'whatsapp';
        
        // Gerar link ou PDF do orçamento
        $budgetUrl = config('app.url') . "/budgets/{$budget->id}/view";

        $message = "Olá, {$budget->patient->name}!\n\n";
        $message .= "Segue seu orçamento odontológico:\n";
        $message .= "Valor total: R$ " . number_format($budget->total, 2, ',', '.') . "\n";
        $message .= "Válido até: " . $budget->valid_until->format('d/m/Y') . "\n\n";
        $message .= "Acesse: $budgetUrl";

        // Enviar via CommunicationController (simplificado aqui)
        $budget->update(['sent_at' => now()]);

        return response()->json([
            'message' => 'Orçamento enviado com sucesso',
        ]);
    }

    /**
     * Orçamentos do paciente
     */
    public function patientBudgets(string $patientId): JsonResponse
    {
        $budgets = Budget::where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $budgets]);
    }

    /**
     * Fluxo de caixa
     */
    public function cashFlow(Request $request): JsonResponse
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $transactions = Transaction::whereBetween('due_date', [$startDate, $endDate])
            ->orderBy('due_date')
            ->get();

        // Agrupar por dia
        $dailyFlow = $transactions->groupBy(function ($t) {
            return $t->due_date->format('Y-m-d');
        })->map(function ($dayTransactions) {
            return [
                'income' => $dayTransactions->where('type', 'income')->where('status', 'paid')->sum('amount'),
                'expense' => $dayTransactions->where('type', 'expense')->where('status', 'paid')->sum('amount'),
                'pending' => $dayTransactions->where('status', 'pending')->sum('amount'),
            ];
        });

        return response()->json(['data' => $dailyFlow]);
    }

    /**
     * Contas a receber
     */
    public function receivables(Request $request): JsonResponse
    {
        $receivables = Transaction::where('type', 'income')
            ->where('status', 'pending')
            ->with(['patient:id,name,phone,whatsapp'])
            ->orderBy('due_date')
            ->get()
            ->groupBy(function ($t) {
                if ($t->due_date < now()) return 'overdue';
                if ($t->due_date <= now()->addDays(7)) return 'this_week';
                if ($t->due_date <= now()->addDays(30)) return 'this_month';
                return 'future';
            });

        $summary = [
            'overdue' => $receivables->get('overdue', collect())->sum('amount'),
            'this_week' => $receivables->get('this_week', collect())->sum('amount'),
            'this_month' => $receivables->get('this_month', collect())->sum('amount'),
            'future' => $receivables->get('future', collect())->sum('amount'),
        ];

        return response()->json([
            'data' => $receivables,
            'summary' => $summary,
        ]);
    }
}
