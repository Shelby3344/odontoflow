# 🚀 Setup do OdontoFlow

## Pré-requisitos

- PHP 8.3+
- Composer 2.x
- Node.js 20+
- PostgreSQL 16+ (com pgvector)
- Redis 7+
- Docker & Docker Compose (opcional)

---

## 🐳 Setup com Docker (Recomendado)

### 1. Clone e configure

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/odontoflow.git
cd odontoflow

# Copie o arquivo de ambiente
cp .env.example .env

# Edite as variáveis de ambiente
nano .env
```

### 2. Inicie os containers

```bash
# Build e start
docker-compose up -d --build

# Verifique os logs
docker-compose logs -f
```

### 3. Configure o backend

```bash
# Entre no container da API
docker-compose exec api sh

# Gere a chave da aplicação
php artisan key:generate

# Execute as migrations
php artisan migrate

# Execute os seeders
php artisan db:seed

# Gere os embeddings da base de conhecimento
php artisan ai:generate-embeddings
```

### 4. Acesse o sistema

- **Frontend**: http://localhost
- **API**: http://localhost/api/v1
- **Horizon (Queues)**: http://localhost/horizon
- **MinIO Console**: http://localhost:9001

---

## 💻 Setup Local (Desenvolvimento)

### Backend (Laravel)

```bash
cd backend

# Instale as dependências
composer install

# Configure o ambiente
cp .env.example .env
php artisan key:generate

# Configure o banco de dados no .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=odontoflow
# DB_USERNAME=postgres
# DB_PASSWORD=secret

# Execute as migrations
php artisan migrate

# Execute os seeders
php artisan db:seed

# Inicie o servidor
php artisan serve

# Em outro terminal, inicie o Horizon (queues)
php artisan horizon
```

### Frontend (React)

```bash
cd frontend

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env.local
# VITE_API_URL=http://localhost:8000/api/v1

# Inicie o servidor de desenvolvimento
npm run dev
```

---

## 🔧 Configurações Importantes

### OpenAI API

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### PostgreSQL com pgvector

```sql
-- Habilite a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Redis

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

---

## 📦 Comandos Úteis

### Backend

```bash
# Limpar cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Gerar documentação da API
php artisan l5-swagger:generate

# Executar testes
php artisan test

# Verificar filas
php artisan horizon:status
```

### Frontend

```bash
# Build para produção
npm run build

# Executar testes
npm run test

# Lint
npm run lint
```

### Docker

```bash
# Parar containers
docker-compose down

# Rebuild específico
docker-compose up -d --build api

# Ver logs
docker-compose logs -f api

# Acessar container
docker-compose exec api sh
```

---

## 🔐 Primeiro Acesso

Após o setup, acesse o sistema com as credenciais padrão:

- **Email**: admin@odontoflow.com.br
- **Senha**: OdontoFlow@2024

⚠️ **Importante**: Altere a senha imediatamente após o primeiro acesso!

---

## 🐛 Troubleshooting

### Erro de conexão com banco

```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps postgres

# Verifique os logs
docker-compose logs postgres
```

### Erro de permissão no storage

```bash
# No container ou local
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Filas não processando

```bash
# Reinicie o Horizon
php artisan horizon:terminate
php artisan horizon
```

### Embeddings não gerados

```bash
# Gere manualmente
php artisan ai:generate-embeddings --force
```

---

## 📞 Suporte

- **Documentação**: /docs
- **Issues**: GitHub Issues
- **Email**: suporte@odontoflow.com.br
