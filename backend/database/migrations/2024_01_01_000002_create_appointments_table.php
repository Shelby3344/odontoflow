<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->nullable();
            $table->uuid('professional_id');
            
            // Horário
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->integer('duration'); // minutos
            
            // Tipo
            $table->string('type', 50)->default('consultation');
            $table->uuid('procedure_type_id')->nullable();
            
            // Status
            $table->string('status', 20)->default('scheduled');
            // scheduled, confirmed, waiting, in_progress, completed, cancelled, no_show
            
            // Confirmação
            $table->timestamp('confirmed_at')->nullable();
            $table->string('confirmed_via', 20)->nullable();
            
            // Observações
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            // IA
            $table->decimal('ai_risk_score', 3, 2)->nullable();
            $table->boolean('ai_suggested')->default(false);
            
            // Recorrência
            $table->uuid('recurrence_id')->nullable();
            $table->string('recurrence_rule')->nullable();
            
            // Cancelamento
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancelled_reason')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('set null');
            $table->foreign('professional_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index(['professional_id', 'start_time']);
            $table->index('patient_id');
            $table->index('status');
            $table->index('start_time');
        });

        Schema::create('schedule_blocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('professional_id');
            
            // Período
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            
            // Tipo
            $table->string('type', 50); // lunch, vacation, meeting, personal
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            
            // Recorrência
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule')->nullable();
            
            $table->timestamps();
            
            $table->foreign('professional_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['professional_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_blocks');
        Schema::dropIfExists('appointments');
    }
};
