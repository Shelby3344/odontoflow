<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\ScheduleController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\OdontogramController;
use App\Http\Controllers\Api\V1\AIController;
use App\Http\Controllers\Api\V1\CommunicationController;
use App\Http\Controllers\Api\V1\FinancialController;
use App\Http\Controllers\Api\V1\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes - OdontoFlow
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'version' => '1.0.0']));

// API v1
Route::prefix('v1')->group(function () {

    // ==========================================
    // AUTH (Público)
    // ==========================================
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });

    // ==========================================
    // ROTAS AUTENTICADAS
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::put('/password', [AuthController::class, 'updatePassword']);
        });

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // ==========================================
        // PACIENTES
        // ==========================================
        Route::prefix('patients')->group(function () {
            Route::get('/', [PatientController::class, 'index']);
            Route::post('/', [PatientController::class, 'store']);
            Route::get('/at-risk', [PatientController::class, 'atRisk']);
            Route::get('/inactive', [PatientController::class, 'inactive']);
            Route::get('/birthdays', [PatientController::class, 'birthdays']);
            Route::get('/{id}', [PatientController::class, 'show']);
            Route::put('/{id}', [PatientController::class, 'update']);
            Route::delete('/{id}', [PatientController::class, 'destroy']);
            
            // Odontograma do paciente
            Route::get('/{id}/odontogram', [OdontogramController::class, 'show']);
            Route::put('/{id}/odontogram', [OdontogramController::class, 'update']);
            
            // Financeiro do paciente
            Route::get('/{id}/transactions', [FinancialController::class, 'patientTransactions']);
            Route::get('/{id}/budgets', [FinancialController::class, 'patientBudgets']);
        });

        // ==========================================
        // ODONTOGRAMA
        // ==========================================
        Route::prefix('odontogram')->group(function () {
            Route::put('/{patientId}/tooth/{toothNumber}', [OdontogramController::class, 'updateTooth']);
            Route::get('/{patientId}/history', [OdontogramController::class, 'history']);
            Route::get('/{patientId}/analysis', [OdontogramController::class, 'aiAnalysis']);
        });

        // ==========================================
        // AGENDA
        // ==========================================
        Route::prefix('schedule')->group(function () {
            Route::get('/appointments', [ScheduleController::class, 'index']);
            Route::post('/appointments', [ScheduleController::class, 'store']);
            Route::get('/appointments/{id}', [ScheduleController::class, 'show']);
            Route::put('/appointments/{id}', [ScheduleController::class, 'update']);
            
            // Ações de status
            Route::post('/appointments/{id}/cancel', [ScheduleController::class, 'cancel']);
            Route::post('/appointments/{id}/confirm', [ScheduleController::class, 'confirm']);
            Route::post('/appointments/{id}/check-in', [ScheduleController::class, 'checkIn']);
            Route::post('/appointments/{id}/start', [ScheduleController::class, 'startService']);
            Route::post('/appointments/{id}/complete', [ScheduleController::class, 'completeService']);
            Route::post('/appointments/{id}/no-show', [ScheduleController::class, 'noShow']);
            
            // Disponibilidade e IA
            Route::get('/available-slots', [ScheduleController::class, 'availableSlots']);
            Route::get('/smart-suggestions', [ScheduleController::class, 'smartSuggestions']);
            
            // Bloqueios
            Route::get('/blocks', [ScheduleController::class, 'blocks']);
            Route::post('/blocks', [ScheduleController::class, 'createBlock']);
            Route::delete('/blocks/{id}', [ScheduleController::class, 'deleteBlock']);
        });

        // ==========================================
        // INTELIGÊNCIA ARTIFICIAL
        // ==========================================
        Route::prefix('ai')->group(function () {
            Route::post('/evolution', [AIController::class, 'generateEvolution']);
            Route::post('/diagnosis', [AIController::class, 'suggestDiagnosis']);
            Route::post('/treatment', [AIController::class, 'suggestTreatment']);
            Route::post('/chat', [AIController::class, 'chat']);
            Route::post('/no-show-risk', [AIController::class, 'analyzeNoShowRisk']);
            Route::get('/financial-insights', [AIController::class, 'financialInsights']);
            Route::post('/message', [AIController::class, 'generateMessage']);
            Route::post('/feedback', [AIController::class, 'feedback']);
        });

        // ==========================================
        // COMUNICAÇÃO
        // ==========================================
        Route::prefix('communication')->group(function () {
            Route::get('/templates', [CommunicationController::class, 'templates']);
            Route::post('/templates', [CommunicationController::class, 'createTemplate']);
            Route::put('/templates/{id}', [CommunicationController::class, 'updateTemplate']);
            
            Route::post('/send', [CommunicationController::class, 'send']);
            Route::post('/send-bulk', [CommunicationController::class, 'sendBulk']);
            Route::get('/history', [CommunicationController::class, 'history']);
        });

        // ==========================================
        // FINANCEIRO
        // ==========================================
        Route::prefix('financial')->group(function () {
            // Dashboard
            Route::get('/dashboard', [FinancialController::class, 'dashboard']);
            Route::get('/cash-flow', [FinancialController::class, 'cashFlow']);
            Route::get('/receivables', [FinancialController::class, 'receivables']);
            
            // Transações
            Route::get('/transactions', [FinancialController::class, 'transactions']);
            Route::post('/transactions', [FinancialController::class, 'createTransaction']);
            Route::put('/transactions/{id}', [FinancialController::class, 'updateTransaction']);
            Route::post('/transactions/{id}/pay', [FinancialController::class, 'markAsPaid']);
            
            // Orçamentos
            Route::get('/budgets', [FinancialController::class, 'budgets']);
            Route::post('/budgets', [FinancialController::class, 'createBudget']);
            Route::get('/budgets/{id}', [FinancialController::class, 'showBudget']);
            Route::put('/budgets/{id}', [FinancialController::class, 'updateBudget']);
            Route::post('/budgets/{id}/approve', [FinancialController::class, 'approveBudget']);
            Route::post('/budgets/{id}/send', [FinancialController::class, 'sendBudget']);
        });

        // ==========================================
        // RELATÓRIOS
        // ==========================================
        Route::prefix('reports')->group(function () {
            Route::get('/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/appointments', [ReportController::class, 'appointments']);
            Route::get('/financial', [ReportController::class, 'financial']);
            Route::get('/patients', [ReportController::class, 'patients']);
            Route::get('/procedures', [ReportController::class, 'procedures']);
            Route::get('/professionals', [ReportController::class, 'professionals']);
            Route::get('/export/{type}', [ReportController::class, 'export']);
        });
    });

    // ==========================================
    // WEBHOOKS (Públicos com validação)
    // ==========================================
    Route::prefix('webhooks')->group(function () {
        Route::post('/whatsapp', [CommunicationController::class, 'whatsappWebhook']);
        Route::post('/sms', [CommunicationController::class, 'smsWebhook']);
    });
});
