<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Provider Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the AI providers used by OdontoFlow for intelligent features.
    |
    */

    'default' => env('AI_PROVIDER', 'openai'),

    'providers' => [
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-4-turbo-preview'),
            'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002'),
            'max_tokens' => env('OPENAI_MAX_TOKENS', 2000),
            'temperature' => env('OPENAI_TEMPERATURE', 0.3),
            'max_retries' => env('OPENAI_MAX_RETRIES', 3),
        ],

        'anthropic' => [
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-3-opus-20240229'),
            'max_tokens' => env('ANTHROPIC_MAX_TOKENS', 2000),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure rate limits for AI requests per user/tenant.
    |
    */

    'rate_limits' => [
        'per_minute' => env('AI_RATE_LIMIT_PER_MINUTE', 10),
        'per_hour' => env('AI_RATE_LIMIT_PER_HOUR', 100),
        'per_day' => env('AI_RATE_LIMIT_PER_DAY', 500),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable or disable specific AI features.
    |
    */

    'features' => [
        'clinical_evolution' => env('AI_FEATURE_CLINICAL_EVOLUTION', true),
        'diagnosis_suggestion' => env('AI_FEATURE_DIAGNOSIS', true),
        'treatment_plan' => env('AI_FEATURE_TREATMENT_PLAN', true),
        'no_show_prediction' => env('AI_FEATURE_NO_SHOW', true),
        'financial_insights' => env('AI_FEATURE_FINANCIAL', true),
        'chat_assistant' => env('AI_FEATURE_CHAT', true),
        'message_generation' => env('AI_FEATURE_MESSAGE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | RAG Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the Retrieval-Augmented Generation system.
    |
    */

    'rag' => [
        'enabled' => env('AI_RAG_ENABLED', true),
        'similarity_threshold' => env('AI_RAG_SIMILARITY_THRESHOLD', 0.7),
        'max_results' => env('AI_RAG_MAX_RESULTS', 5),
        'cache_ttl' => env('AI_RAG_CACHE_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging & Monitoring
    |--------------------------------------------------------------------------
    |
    | Configure AI interaction logging for analytics and improvement.
    |
    */

    'logging' => [
        'enabled' => env('AI_LOGGING_ENABLED', true),
        'log_prompts' => env('AI_LOG_PROMPTS', true),
        'log_responses' => env('AI_LOG_RESPONSES', true),
        'retention_days' => env('AI_LOG_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cost Management
    |--------------------------------------------------------------------------
    |
    | Configure cost tracking and limits.
    |
    */

    'costs' => [
        'track_costs' => env('AI_TRACK_COSTS', true),
        'monthly_budget' => env('AI_MONTHLY_BUDGET', 500.00), // USD
        'alert_threshold' => env('AI_ALERT_THRESHOLD', 0.8), // 80% of budget
    ],

    /*
    |--------------------------------------------------------------------------
    | Prompts Configuration
    |--------------------------------------------------------------------------
    |
    | Default configurations for prompt building.
    |
    */

    'prompts' => [
        'language' => 'pt-BR',
        'tone' => 'professional',
        'include_disclaimers' => true,
        'max_context_length' => 4000,
    ],
];
