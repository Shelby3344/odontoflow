<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Anamnese
        Schema::create('anamnesis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            
            $table->json('data')->nullable();
            
            $table->integer('version')->default(1);
            $table->uuid('filled_by')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('filled_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index('patient_id');
        });

        // Prontuário (Evoluções Clínicas)
        Schema::create('medical_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            $table->uuid('professional_id');
            $table->uuid('appointment_id')->nullable();
            
            // Conteúdo
            $table->text('chief_complaint')->nullable();
            $table->text('clinical_examination')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment_plan')->nullable();
            $table->text('procedures_performed')->nullable();
            $table->text('prescriptions')->nullable();
            $table->text('observations')->nullable();
            
            // IA
            $table->boolean('ai_generated')->default(false);
            $table->json('ai_suggestions')->nullable();
            $table->decimal('ai_confidence', 3, 2)->nullable();
            
            // Versionamento
            $table->integer('version')->default(1);
            $table->uuid('previous_version_id')->nullable();
            
            // Assinatura digital
            $table->timestamp('signed_at')->nullable();
            $table->string('signature_hash', 64)->nullable();
            
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('professional_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('set null');
            
            $table->index('patient_id');
            $table->index('professional_id');
            $table->index('created_at');
        });

        // Odontograma
        Schema::create('odontograms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            
            $table->json('teeth_data')->nullable();
            $table->string('type', 20)->default('permanent');
            
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->index('patient_id');
        });

        // Histórico do Odontograma
        Schema::create('odontogram_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('odontogram_id');
            $table->string('tooth_number', 5);
            
            $table->json('previous_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('change_type', 50)->nullable();
            
            $table->uuid('changed_by');
            $table->uuid('procedure_id')->nullable();
            
            $table->timestamp('created_at');
            
            $table->foreign('odontogram_id')->references('id')->on('odontograms')->onDelete('cascade');
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('cascade');
        });

        // Tipos de Procedimentos
        Schema::create('procedure_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->string('code', 20)->unique()->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable();
            
            $table->decimal('default_price', 10, 2)->nullable();
            $table->integer('default_duration')->nullable();
            
            $table->boolean('requires_tooth')->default(true);
            $table->boolean('requires_surface')->default(false);
            
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
        });

        // Procedimentos Realizados
        Schema::create('procedures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            $table->uuid('professional_id');
            $table->uuid('procedure_type_id');
            $table->uuid('appointment_id')->nullable();
            $table->uuid('medical_record_id')->nullable();
            
            // Localização
            $table->string('tooth_number', 5)->nullable();
            $table->json('surfaces')->nullable();
            
            // Valores
            $table->decimal('price', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('final_price', 10, 2)->nullable();
            
            // Status
            $table->string('status', 20)->default('planned');
            
            // Datas
            $table->date('planned_date')->nullable();
            $table->timestamp('executed_at')->nullable();
            
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('professional_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('procedure_type_id')->references('id')->on('procedure_types')->onDelete('cascade');
            
            $table->index('patient_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procedures');
        Schema::dropIfExists('procedure_types');
        Schema::dropIfExists('odontogram_history');
        Schema::dropIfExists('odontograms');
        Schema::dropIfExists('medical_records');
        Schema::dropIfExists('anamnesis');
    }
};
