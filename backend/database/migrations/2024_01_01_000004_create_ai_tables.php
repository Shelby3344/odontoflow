<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Habilitar extensão pgvector
        if (config('database.default') === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
        }

        // Interações com IA
        Schema::create('ai_interactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            
            // Contexto
            $table->string('context_type', 50);
            $table->jsonb('context_data');
            
            // Request
            $table->text('prompt');
            $table->string('model', 50);
            
            // Response
            $table->text('response');
            $table->integer('tokens_used')->nullable();
            $table->integer('latency_ms')->nullable();
            
            // Feedback
            $table->boolean('was_accepted')->nullable();
            $table->boolean('was_edited')->nullable();
            $table->string('user_feedback', 20)->nullable();
            $table->text('feedback_notes')->nullable();
            
            // Custo
            $table->decimal('cost_usd', 10, 6)->nullable();
            
            $table->timestamp('created_at');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index('user_id');
            $table->index('context_type');
            $table->index('created_at');
            $table->index(['was_accepted', 'user_feedback']);
        });

        // Base de conhecimento para RAG
        Schema::create('knowledge_base', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Categorização
            $table->string('category', 100);
            $table->string('subcategory', 100)->nullable();
            
            // Conteúdo
            $table->string('title');
            $table->text('content');
            
            // Metadados
            $table->string('source')->nullable();
            $table->jsonb('metadata')->default('{}');
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->index('category');
            $table->index('is_active');
        });

        // Adicionar coluna de embedding (pgvector)
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE knowledge_base ADD COLUMN embedding vector(1536)');
            DB::statement('CREATE INDEX knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
        }

        // Conversas do assistente
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            
            $table->string('title')->nullable();
            $table->jsonb('messages')->default('[]');
            $table->jsonb('context')->nullable();
            
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });

        // Sugestões da IA (para aprendizado)
        Schema::create('ai_suggestions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('interaction_id');
            
            $table->string('suggestion_type', 50);
            $table->jsonb('suggestion_data');
            
            // Resultado
            $table->boolean('was_used')->nullable();
            $table->jsonb('modifications')->nullable();
            
            $table->timestamp('created_at');
            
            $table->foreign('interaction_id')->references('id')->on('ai_interactions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_suggestions');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('knowledge_base');
        Schema::dropIfExists('ai_interactions');
    }
};
