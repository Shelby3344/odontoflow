# 🦷 OdontoFlow

**Sistema Inteligente de Gestão para Clínicas Odontológicas**

> SaaS B2B com IA contextual como diferencial competitivo central

## 🎯 Visão do Produto

OdontoFlow é uma plataforma completa de gestão odontológica que utiliza Inteligência Artificial para:
- Automatizar tarefas clínicas e administrativas
- Reduzir faltas e horários ociosos
- Apoiar decisões clínicas (sem substituir o profissional)
- Gerar inteligência financeira
- Oferecer experiência premium para clínicas e pacientes

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                           │
│                    Vite + React + TypeScript                    │
│              Design System Próprio + Dark/Light Mode            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API (JWT + OAuth2)
┌─────────────────────────▼───────────────────────────────────────┐
│                      BACKEND (Laravel)                          │
│                   Monólito Modular + Clean Architecture         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Modules    │  │   AI Layer   │  │   Services   │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ • Auth       │  │ • AI Service │  │ • Queue      │          │
│  │ • Patients   │  │ • RAG Engine │  │ • Cache      │          │
│  │ • Clinical   │  │ • Prompt     │  │ • Storage    │          │
│  │ • Schedule   │  │   Builder    │  │ • Notify     │          │
│  │ • Financial  │  │ • Context    │  │ • Audit      │          │
│  │ • Reports    │  │   Builder    │  │ • Export     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   Storage    │          │
│  │  Multi-tenant│  │    Cache     │  │   S3/Minio   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Stack Tecnológica

### Backend
- **Laravel 11** - API RESTful
- **PHP 8.3** - Tipagem forte
- **PostgreSQL** - Multi-tenant com isolamento
- **Redis** - Cache e filas
- **OpenAI/Anthropic** - Motor de IA

### Frontend
- **Vite** - Build tool
- **React 18** - UI Library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Query** - Server state

## 📁 Estrutura do Projeto

```
odontoflow/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Domain/            # Entidades e regras de negócio
│   │   ├── Application/       # Use Cases e Services
│   │   ├── Infrastructure/    # Implementações externas
│   │   └── Interfaces/        # Controllers e Resources
│   ├── Modules/               # Módulos do sistema
│   └── ...
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── features/          # Features por domínio
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   └── stores/            # State management
│   └── ...
└── docs/                       # Documentação
```

## 🔐 Segurança & LGPD

- Criptografia AES-256 para dados sensíveis
- JWT + OAuth2 para autenticação
- RBAC granular
- Logs imutáveis de auditoria
- Backup automático criptografado
- Conformidade total com LGPD

## 📊 Módulos Principais

1. **Prontuário Eletrônico Inteligente** - IA gera evoluções clínicas
2. **Odontograma Interativo** - SVG com IA preditiva
3. **Agenda Inteligente** - Predição de faltas e overbooking
4. **Comunicação Automatizada** - WhatsApp, SMS, E-mail
5. **Financeiro Inteligente** - Insights e previsões
6. **Assistente IA** - Apoio contextual ao dentista

## 🎨 Design System

- Tema claro/escuro
- Componentes acessíveis (WCAG 2.1)
- Microinterações elegantes
- Responsivo (mobile-first)
- Estética HealthTech premium

---

**Licença:** GitFlow (Zuckszinho) | **Versão:** 1.0.0
