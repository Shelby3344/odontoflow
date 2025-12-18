<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Transações financeiras
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->nullable();
            $table->uuid('professional_id')->nullable();
            $table->uuid('budget_id')->nullable();
            
            $table->string('type', 20); // income, expense
            $table->string('category', 50);
            $table->string('description');
            $table->decimal('amount', 10, 2);
            
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method', 50)->nullable();
            
            $table->integer('installment_number')->nullable();
            $table->integer('total_installments')->nullable();
            
            $table->string('procedure_type', 100)->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->index(['patient_id', 'due_date']);
            $table->index(['type', 'status']);
            $table->index('due_date');
        });

        // Orçamentos
        Schema::create('budgets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            $table->uuid('professional_id');
            
            $table->json('items');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            
            $table->text('notes')->nullable();
            $table->date('valid_until');
            
            $table->string('status', 20)->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('sent_at')->nullable();
            
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('professional_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['patient_id', 'status']);
        });

        // Templates de mensagem
        Schema::create('message_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->string('name', 100);
            $table->string('type', 50);
            $table->string('channel', 20);
            $table->string('subject', 200)->nullable();
            $table->text('content');
            $table->json('variables')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
        });

        // Log de comunicações
        Schema::create('communication_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->nullable();
            $table->uuid('appointment_id')->nullable();
            
            $table->string('channel', 20);
            $table->string('type', 50);
            $table->uuid('template_id')->nullable();
            $table->text('content');
            
            $table->string('status', 20);
            $table->string('external_id')->nullable();
            $table->text('error_message')->nullable();
            
            $table->uuid('sent_by')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['patient_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_logs');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('transactions');
    }
};
