#  OdontoFlow - Gitflow

**Sistema Inteligente de Gestão para Clínicas Odontológicas**

![OdontoFlow](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-11-red.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)

## 🎯 Visão do Produto

OdontoFlow é uma plataforma completa de gestão odontológica que utiliza Inteligência Artificial para:
- Automatizar tarefas clínicas e administrativas
- Reduzir faltas e horários ociosos
- Apoiar decisões clínicas (sem substituir o profissional)
- Gerar inteligência financeira
- Oferecer experiência premium para clínicas e pacientes

## ✨ Features Principais

- 📋 **Prontuário Eletrônico Inteligente** - IA gera evoluções clínicas automaticamente
- 🦷 **Odontograma Interativo** - SVG com análise preditiva de IA
- 📅 **Agenda Inteligente** - Predição de faltas e sugestão de overbooking
- 💬 **Comunicação Automatizada** - WhatsApp, SMS, E-mail
- 💰 **Financeiro Completo** - Dashboard, transações, orçamentos e relatórios
- 🤖 **Assistente IA** - Chat contextual para apoio ao dentista
- 📊 **Relatórios Avançados** - Analytics de agendamentos, financeiro, pacientes
- 🌙 **Dark/Light Mode** - Interface adaptável com design premium

## 🚀 Quick Start

### Pré-requisitos

- PHP 8.2+
- Composer
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/odontoflow.git
cd odontoflow

# Backend
cd backend
composer install --ignore-platform-reqs
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

### Credenciais de Acesso (Demo)

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@odontoflow.com.br | admin123 |
| Dentista | dentista@odontoflow.com.br | dentista123 |
| Recepção | recepcao@odontoflow.com.br | recepcao123 |

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                           │
│                    Vite + React + TypeScript                    │
│              Design System Próprio + Dark/Light Mode            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API (JWT + Sanctum)
┌─────────────────────────▼───────────────────────────────────────┐
│                      BACKEND (Laravel 11)                       │
│                   Monólito Modular + Clean Architecture         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Modules    │  │   AI Layer   │  │   Services   │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ • Auth       │  │ • OpenAI     │  │ • Queue      │          │
│  │ • Patients   │  │ • Chat       │  │ • Cache      │          │
│  │ • Clinical   │  │ • Diagnosis  │  │ • Storage    │          │
│  │ • Schedule   │  │ • Evolution  │  │ • Notify     │          │
│  │ • Financial  │  │ • Treatment  │  │ • Audit      │          │
│  │ • Reports    │  │   Plan       │  │ • Export     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SQLite     │  │    Redis     │  │   Storage    │          │
│  │   (Dev)      │  │    Cache     │  │   Local/S3   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Laravel | 11 | Framework PHP |
| PHP | 8.2+ | Linguagem |
| SQLite | 3 | Banco de dados (dev) |
| Sanctum | 4 | Autenticação API |
| OpenAI | - | Motor de IA |

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Vite | 5 | Build tool |
| React | 18 | UI Library |
| TypeScript | 5 | Type safety |
| React Query | 5 | Server state |
| React Router | 6 | Routing |
| Recharts | 2 | Gráficos |

## 📁 Estrutura do Projeto

```
odontoflow/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Domain/            # Entidades e regras de negócio
│   │   ├── Application/       # Use Cases e Services
│   │   ├── Infrastructure/    # Implementações externas
│   │   ├── Http/Controllers/  # API Controllers
│   │   └── Models/            # Eloquent Models
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Demo data seeders
│   └── routes/api.php         # API routes
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── ui/           # Design System (Button, Card, Input...)
│   │   │   ├── layout/       # Sidebar, Header
│   │   │   └── dashboard/    # StatsCard, AppointmentsList
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── contexts/         # React Contexts (Auth, Theme)
│   │   ├── services/         # API services
│   │   ├── styles/           # CSS (Design System, Base, Pages)
│   │   └── routes/           # React Router config
│   └── ...
│
└── docs/                       # Documentação
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── SECURITY.md
    ├── SETUP.md
    └── ROADMAP.md
```

## 🎨 Design System

O OdontoFlow possui um Design System próprio inspirado em interfaces HealthTech premium:

### Características
- **Tema Claro/Escuro** - Toggle automático ou manual
- **Cores** - Paleta médica (azul, verde, neutros)
- **Tipografia** - Inter font, escala consistente
- **Componentes** - Button, Card, Input, Badge, Table, Modal, Alert, Tooltip, Loader
- **Layout** - Sidebar animada, Header com busca e notificações
- **Responsivo** - Desktop-first, adaptável para tablet/mobile

### Variáveis CSS
```css
/* Cores principais */
--primary-500: #3b82f6;
--secondary-500: #14b8a6;
--success-500: #22c55e;
--warning-500: #f59e0b;
--danger-500: #ef4444;

/* Dark Mode */
--bg-primary: #18181b;
--bg-secondary: #0f0f10;
--text-primary: #fafafa;
```

## 📊 API Endpoints

### Autenticação
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Pacientes
```
GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/{id}
PUT    /api/v1/patients/{id}
DELETE /api/v1/patients/{id}
```

### Agenda
```
GET    /api/v1/schedule/appointments
POST   /api/v1/schedule/appointments
POST   /api/v1/schedule/appointments/{id}/confirm
POST   /api/v1/schedule/appointments/{id}/check-in
POST   /api/v1/schedule/appointments/{id}/complete
```

### Financeiro
```
GET    /api/v1/financial/dashboard
GET    /api/v1/financial/transactions
GET    /api/v1/financial/budgets
GET    /api/v1/financial/cash-flow
```

### IA
```
POST   /api/v1/ai/chat
POST   /api/v1/ai/evolution
POST   /api/v1/ai/diagnosis
POST   /api/v1/ai/treatment
```

## 🔐 Segurança & LGPD

- ✅ Autenticação JWT via Laravel Sanctum
- ✅ RBAC (Role-Based Access Control)
- ✅ Criptografia de dados sensíveis
- ✅ Logs de auditoria
- ✅ Conformidade LGPD
- ✅ Proteção CSRF/XSS

## 🧪 Testes

```bash
# Backend
cd backend
php artisan test

# Frontend
cd frontend
npm run test
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
APP_NAME=OdontoFlow
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=sqlite
OPENAI_API_KEY=your-key-here
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🗺️ Roadmap

- [x] MVP - Sistema base funcional
- [x] Design System Premium
- [x] Dark/Light Mode
- [x] Dashboard com KPIs
- [x] Agenda interativa
- [x] Módulo financeiro completo
- [x] Assistente IA
- [ ] App Mobile (React Native)
- [ ] Integração WhatsApp Business
- [ ] Multi-tenancy completo
- [ ] Marketplace de integrações

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para revolucionar a gestão odontológica**

**Versão:** 1.0.0 | **Autor:** Zuckszinho
