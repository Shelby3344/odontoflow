<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Dados pessoais
            $table->string('name');
            $table->string('email')->nullable();
            $table->text('document')->nullable(); // CPF criptografado
            $table->string('document_hash', 64)->nullable()->index(); // Hash para busca
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            
            // Contato
            $table->string('phone', 20)->nullable();
            $table->string('phone_secondary', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            
            // Endereço
            $table->string('address_street')->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_complement', 100)->nullable();
            $table->string('address_neighborhood', 100)->nullable();
            $table->string('address_city', 100)->nullable();
            $table->char('address_state', 2)->nullable();
            $table->string('address_zipcode', 10)->nullable();
            
            // Responsável (menores)
            $table->string('guardian_name')->nullable();
            $table->text('guardian_document')->nullable();
            $table->string('guardian_phone', 20)->nullable();
            
            // Convênio
            $table->uuid('insurance_id')->nullable();
            $table->string('insurance_number', 50)->nullable();
            $table->date('insurance_validity')->nullable();
            
            // Preferências
            $table->string('preferred_contact', 20)->default('whatsapp');
            $table->string('preferred_schedule_time', 20)->nullable();
            $table->boolean('communication_consent')->default(true);
            $table->boolean('marketing_consent')->default(false);
            
            // Métricas IA
            $table->decimal('attendance_score', 3, 2)->default(1.00);
            $table->decimal('engagement_score', 3, 2)->default(0.50);
            $table->decimal('risk_score', 3, 2)->default(0.00);
            
            // Status
            $table->string('status', 20)->default('active');
            $table->string('source', 50)->nullable();
            
            // Timestamps
            $table->timestamp('first_visit_at')->nullable();
            $table->timestamp('last_visit_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('name');
            $table->index('phone');
            $table->index('status');
            $table->index('created_at');
        });

        // Full-text search index (PostgreSQL)
        if (config('database.default') === 'pgsql') {
            DB::statement('CREATE INDEX patients_name_trgm_idx ON patients USING gin (name gin_trgm_ops)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
