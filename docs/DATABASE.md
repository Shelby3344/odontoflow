# 🗄️ Modelagem de Banco de Dados - OdontoFlow

## Estratégia Multi-Tenant

```sql
-- Database Central (Billing, Planos, Tenants)
central_odontoflow

-- Database por Tenant (Dados Clínicos)
tenant_{uuid}_odontoflow
```

## Schema Central

### Tenants (Clínicas)

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    document VARCHAR(20) NOT NULL, -- CNPJ
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zipcode VARCHAR(10),
    
    -- Configurações
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]', -- Features habilitadas
    
    -- Plano
    plan_id UUID REFERENCES plans(id),
    plan_started_at TIMESTAMP,
    plan_expires_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
    database_name VARCHAR(100) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### Planos

```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Limites
    max_users INT DEFAULT 5,
    max_patients INT DEFAULT 500,
    max_storage_gb INT DEFAULT 5,
    ai_requests_month INT DEFAULT 100,
    
    -- Preços
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    
    -- Features
    features JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Schema Tenant (Por Clínica)

### Usuários

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    
    -- Dados profissionais
    document VARCHAR(20), -- CPF
    professional_id VARCHAR(20), -- CRO
    professional_state CHAR(2),
    specialty VARCHAR(100),
    
    -- Contato
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    -- Configurações
    settings JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Segurança
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    
    -- Timestamps
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_professional_id ON users(professional_id);
```

### Roles e Permissões (RBAC)

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false, -- Roles do sistema não podem ser deletadas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Roles padrão
INSERT INTO roles (name, slug, permissions, is_system) VALUES
('Administrador', 'admin', '["*"]', true),
('Dentista', 'dentist', '["patients.*", "clinical.*", "schedule.*", "ai.*"]', true),
('Auxiliar', 'assistant', '["patients.view", "clinical.view", "schedule.*"]', true),
('Recepção', 'receptionist', '["patients.*", "schedule.*", "financial.view"]', true);
```

### Pacientes

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados pessoais (campos sensíveis criptografados)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    document VARCHAR(20), -- CPF (criptografado)
    document_hash VARCHAR(64), -- Hash para busca
    birth_date DATE,
    gender VARCHAR(20),
    
    -- Contato
    phone VARCHAR(20),
    phone_secondary VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zipcode VARCHAR(10),
    
    -- Responsável (menores)
    guardian_name VARCHAR(255),
    guardian_document VARCHAR(20),
    guardian_phone VARCHAR(20),
    
    -- Convênio
    insurance_id UUID REFERENCES insurances(id),
    insurance_number VARCHAR(50),
    insurance_validity DATE,
    
    -- Preferências
    preferred_contact VARCHAR(20) DEFAULT 'whatsapp',
    preferred_schedule_time VARCHAR(20),
    communication_consent BOOLEAN DEFAULT true,
    
    -- Métricas IA
    attendance_score DECIMAL(3,2), -- Score de comparecimento (0-1)
    engagement_score DECIMAL(3,2), -- Score de engajamento
    risk_score DECIMAL(3,2), -- Risco de abandono
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(50), -- Origem do cadastro
    
    -- Timestamps
    first_visit_at TIMESTAMP,
    last_visit_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_patients_document_hash ON patients(document_hash);
CREATE INDEX idx_patients_name ON patients USING gin(name gin_trgm_ops);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_status ON patients(status);
```

### Anamnese

```sql
CREATE TABLE anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Dados estruturados
    data JSONB NOT NULL DEFAULT '{}',
    /*
    {
        "medical_history": {
            "diabetes": false,
            "hypertension": true,
            "heart_disease": false,
            "allergies": ["penicilina"],
            "medications": ["losartana 50mg"],
            "surgeries": [],
            "observations": ""
        },
        "dental_history": {
            "last_visit": "2024-01-15",
            "main_complaint": "Dor no dente 36",
            "brushing_frequency": 3,
            "flossing": true,
            "sensitivity": ["cold"],
            "bruxism": false
        },
        "habits": {
            "smoking": false,
            "alcohol": "occasional",
            "diet": "normal"
        }
    }
    */
    
    -- Versão e auditoria
    version INT DEFAULT 1,
    filled_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anamnesis_patient ON anamnesis(patient_id);
```

### Prontuário (Evoluções Clínicas)

```sql
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    
    -- Conteúdo
    chief_complaint TEXT, -- Queixa principal
    clinical_examination TEXT, -- Exame clínico
    diagnosis TEXT, -- Diagnóstico
    treatment_plan TEXT, -- Plano de tratamento
    procedures_performed TEXT, -- Procedimentos realizados
    prescriptions TEXT, -- Prescrições
    observations TEXT, -- Observações
    
    -- IA
    ai_generated BOOLEAN DEFAULT false,
    ai_suggestions JSONB, -- Sugestões da IA
    ai_confidence DECIMAL(3,2), -- Confiança da IA
    
    -- Versionamento
    version INT DEFAULT 1,
    previous_version_id UUID REFERENCES medical_records(id),
    
    -- Assinatura digital
    signed_at TIMESTAMP,
    signature_hash VARCHAR(64),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_professional ON medical_records(professional_id);
CREATE INDEX idx_medical_records_created ON medical_records(created_at DESC);
```

### Odontograma

```sql
CREATE TABLE odontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Dados dos dentes (JSON estruturado)
    teeth_data JSONB NOT NULL DEFAULT '{}',
    /*
    {
        "11": {
            "status": "healthy", -- healthy, decayed, restored, missing, implant
            "surfaces": {
                "mesial": "healthy",
                "distal": "restored",
                "vestibular": "healthy",
                "lingual": "healthy",
                "occlusal": "decayed"
            },
            "procedures": ["uuid1", "uuid2"],
            "notes": "Restauração classe II"
        },
        ...
    }
    */
    
    -- Metadados
    type VARCHAR(20) DEFAULT 'permanent', -- permanent, deciduous, mixed
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_odontograms_patient ON odontograms(patient_id);

-- Histórico de alterações no odontograma
CREATE TABLE odontogram_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    odontogram_id UUID NOT NULL REFERENCES odontograms(id) ON DELETE CASCADE,
    tooth_number VARCHAR(5) NOT NULL,
    
    -- Alteração
    previous_data JSONB,
    new_data JSONB,
    change_type VARCHAR(50), -- procedure, status_change, note
    
    -- Auditoria
    changed_by UUID NOT NULL REFERENCES users(id),
    procedure_id UUID REFERENCES procedures(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Procedimentos

```sql
CREATE TABLE procedure_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    code VARCHAR(20) UNIQUE, -- Código TUSS/próprio
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Valores
    default_price DECIMAL(10,2),
    default_duration INT, -- minutos
    
    -- Configurações
    requires_tooth BOOLEAN DEFAULT true,
    requires_surface BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES users(id),
    procedure_type_id UUID NOT NULL REFERENCES procedure_types(id),
    appointment_id UUID REFERENCES appointments(id),
    medical_record_id UUID REFERENCES medical_records(id),
    
    -- Localização
    tooth_number VARCHAR(5),
    surfaces VARCHAR(20)[], -- Array de faces
    
    -- Valores
    price DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    
    -- Datas
    planned_date DATE,
    executed_at TIMESTAMP,
    
    -- Observações
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procedures_patient ON procedures(patient_id);
CREATE INDEX idx_procedures_status ON procedures(status);
```

### Agenda

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES users(id),
    
    -- Horário
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INT NOT NULL, -- minutos
    
    -- Tipo
    type VARCHAR(50) DEFAULT 'consultation', -- consultation, return, procedure, emergency
    procedure_type_id UUID REFERENCES procedure_types(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled',
    -- scheduled, confirmed, waiting, in_progress, completed, cancelled, no_show
    
    -- Confirmação
    confirmed_at TIMESTAMP,
    confirmed_via VARCHAR(20), -- whatsapp, sms, email, phone, app
    
    -- Observações
    notes TEXT,
    internal_notes TEXT,
    
    -- IA
    ai_risk_score DECIMAL(3,2), -- Risco de falta
    ai_suggested BOOLEAN DEFAULT false, -- Sugerido pela IA
    
    -- Recorrência
    recurrence_id UUID,
    recurrence_rule VARCHAR(255), -- RRULE format
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT
);

CREATE INDEX idx_appointments_professional_time ON appointments(professional_id, start_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(start_time);

-- Bloqueios de agenda
CREATE TABLE schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES users(id),
    
    -- Período
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    -- Tipo
    type VARCHAR(50) NOT NULL, -- lunch, vacation, meeting, personal
    title VARCHAR(255),
    description TEXT,
    
    -- Recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Financeiro

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    
    -- Tipo
    type VARCHAR(20) NOT NULL, -- income, expense
    category VARCHAR(50) NOT NULL,
    
    -- Valores
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Pagamento
    payment_method VARCHAR(50), -- cash, credit, debit, pix, insurance, installment
    installments INT DEFAULT 1,
    
    -- Referência
    reference_type VARCHAR(50), -- procedure, budget, other
    reference_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled, refunded
    
    -- Datas
    due_date DATE,
    paid_at TIMESTAMP,
    
    -- Observações
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_patient ON transactions(patient_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);

-- Orçamentos
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    professional_id UUID NOT NULL REFERENCES users(id),
    
    -- Valores
    total_amount DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Itens (procedimentos)
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Validade
    valid_until DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, approved, rejected, expired
    
    -- Aprovação
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    
    -- Observações
    notes TEXT,
    terms TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comunicação

```sql
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    -- Canal
    channel VARCHAR(20) NOT NULL, -- whatsapp, sms, email, push
    
    -- Conteúdo
    template_id UUID REFERENCES communication_templates(id),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    external_id VARCHAR(255), -- ID do provedor
    
    -- Erro
    error_message TEXT,
    
    -- Timestamps
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- reminder, confirmation, follow_up, birthday, marketing
    channel VARCHAR(20) NOT NULL,
    
    -- Conteúdo
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Variáveis disponíveis
    
    -- IA
    ai_tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, formal
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Auditoria

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuário
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Ação
    action VARCHAR(50) NOT NULL, -- create, update, delete, view, export, login, logout
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Dados
    old_values JSONB,
    new_values JSONB,
    
    -- Contexto
    context JSONB DEFAULT '{}',
    
    -- Timestamp (imutável)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Particionamento por mês para performance
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

### IA - Histórico e Aprendizado

```sql
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Contexto
    context_type VARCHAR(50) NOT NULL, -- diagnosis, evolution, schedule, financial
    context_data JSONB NOT NULL,
    
    -- Request
    prompt TEXT NOT NULL,
    model VARCHAR(50) NOT NULL,
    
    -- Response
    response TEXT NOT NULL,
    tokens_used INT,
    latency_ms INT,
    
    -- Feedback
    was_accepted BOOLEAN,
    was_edited BOOLEAN,
    user_feedback VARCHAR(20), -- helpful, not_helpful, incorrect
    feedback_notes TEXT,
    
    -- Custo
    cost_usd DECIMAL(10,6),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(context_type);
CREATE INDEX idx_ai_interactions_feedback ON ai_interactions(was_accepted, user_feedback);

-- Base de conhecimento para RAG
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Categorização
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Embedding para busca vetorial
    embedding vector(1536), -- OpenAI ada-002
    
    -- Metadados
    source VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_base_embedding ON knowledge_base 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Índices e Otimizações

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca fuzzy
CREATE EXTENSION IF NOT EXISTS "vector"; -- Para embeddings (pgvector)

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... repetir para outras tabelas
```
