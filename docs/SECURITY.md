# 🔐 Segurança e LGPD - OdontoFlow

## Visão Geral

O OdontoFlow foi projetado com segurança como prioridade, atendendo aos requisitos da LGPD e melhores práticas de segurança para sistemas de saúde.

---

## 🛡️ Camadas de Segurança

### 1. Infraestrutura

```
┌─────────────────────────────────────────────────────────────┐
│                    WAF (Cloudflare/AWS WAF)                 │
│              DDoS Protection, Rate Limiting                 │
├─────────────────────────────────────────────────────────────┤
│                    Load Balancer (HTTPS)                    │
│                    SSL/TLS 1.3 Only                         │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│              Laravel Security Middleware                    │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│              Encryption at Rest, Row-Level Security         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Autenticação

- **JWT (JSON Web Tokens)** com rotação automática
- **OAuth2** para integrações
- **2FA (Two-Factor Authentication)** opcional
- **Sessões com timeout** configurável
- **Bloqueio após tentativas falhas**

```php
// Configuração de autenticação
'auth' => [
    'token_expiration' => 3600, // 1 hora
    'refresh_token_expiration' => 604800, // 7 dias
    'max_login_attempts' => 5,
    'lockout_duration' => 900, // 15 minutos
    'require_2fa_for_admin' => true,
]
```

### 3. Autorização (RBAC)

```php
// Roles padrão
$roles = [
    'admin' => ['*'], // Acesso total
    'dentist' => [
        'patients.*',
        'clinical.*',
        'schedule.*',
        'ai.*',
        'reports.view',
    ],
    'assistant' => [
        'patients.view',
        'clinical.view',
        'schedule.*',
    ],
    'receptionist' => [
        'patients.*',
        'schedule.*',
        'financial.view',
    ],
];
```

---

## 🔒 Criptografia

### Dados em Repouso

| Campo | Método | Algoritmo |
|-------|--------|-----------|
| CPF/CNPJ | Criptografia | AES-256-GCM |
| Telefone | Criptografia | AES-256-GCM |
| Endereço | Criptografia | AES-256-GCM |
| Prontuário | Criptografia | AES-256-GCM |
| Senhas | Hash | Argon2id |

```php
// Implementação de criptografia
class EncryptedCast implements CastsAttributes
{
    public function get($model, $key, $value, $attributes)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function set($model, $key, $value, $attributes)
    {
        return $value ? Crypt::encryptString($value) : null;
    }
}
```

### Dados em Trânsito

- TLS 1.3 obrigatório
- HSTS habilitado
- Certificate pinning no mobile

### Chaves de Criptografia

- Rotação automática a cada 90 dias
- Armazenamento em HSM (produção)
- Backup seguro de chaves

---

## 📋 Conformidade LGPD

### Bases Legais Utilizadas

1. **Consentimento** - Comunicações de marketing
2. **Execução de contrato** - Prestação de serviços
3. **Obrigação legal** - Prontuários médicos (CFO)
4. **Legítimo interesse** - Melhorias de serviço

### Direitos do Titular

| Direito | Implementação |
|---------|---------------|
| Acesso | Exportação de dados em JSON/PDF |
| Correção | Edição pelo próprio usuário |
| Eliminação | Anonimização (dados clínicos retidos por lei) |
| Portabilidade | Exportação em formato interoperável |
| Revogação | Gestão de consentimentos |

### Retenção de Dados

```php
// Política de retenção
$retention = [
    'prontuarios' => '20 anos', // Obrigação legal CFO
    'financeiro' => '5 anos',   // Obrigação fiscal
    'logs_acesso' => '2 anos',  // Auditoria
    'marketing' => 'até revogação',
    'sessoes' => '30 dias',
];
```

### Anonimização

```php
// Processo de anonimização
public function anonymize(Patient $patient): void
{
    $patient->update([
        'name' => 'ANONIMIZADO_' . $patient->id,
        'email' => null,
        'document' => null,
        'phone' => null,
        'address' => null,
        'anonymized_at' => now(),
    ]);
    
    // Manter prontuários com dados clínicos anonimizados
    $patient->medicalRecords()->update([
        'patient_name' => 'ANONIMIZADO',
    ]);
}
```

---

## 📝 Auditoria

### Logs Imutáveis

```php
// Estrutura de log de auditoria
[
    'id' => 'uuid',
    'user_id' => 'uuid',
    'user_name' => 'string',
    'user_ip' => 'string',
    'user_agent' => 'string',
    'action' => 'create|update|delete|view|export',
    'resource_type' => 'patient|record|appointment',
    'resource_id' => 'uuid',
    'old_values' => 'json',
    'new_values' => 'json',
    'created_at' => 'timestamp',
]
```

### Eventos Auditados

- Login/logout
- Acesso a prontuários
- Alterações em dados sensíveis
- Exportações de dados
- Alterações de permissões
- Tentativas de acesso negadas

### Retenção de Logs

- Logs de auditoria: 2 anos
- Logs de sistema: 90 dias
- Logs de erro: 30 dias

---

## 🛡️ Proteções Implementadas

### OWASP Top 10

| Vulnerabilidade | Proteção |
|-----------------|----------|
| Injection | Prepared statements, ORM |
| Broken Auth | JWT, 2FA, rate limiting |
| Sensitive Data | Criptografia, masking |
| XXE | Desabilitado por padrão |
| Broken Access | RBAC, middleware |
| Misconfiguration | Hardening, scans |
| XSS | CSP, sanitização, escape |
| Insecure Deserialization | Validação de tipos |
| Vulnerable Components | Dependabot, audits |
| Insufficient Logging | Auditoria completa |

### Headers de Segurança

```nginx
# Nginx security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Rate Limiting

```php
// Configuração de rate limiting
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});

RateLimiter::for('ai', function (Request $request) {
    return Limit::perMinute(10)->by($request->user()->id);
});
```

---

## 🔄 Backup e Recuperação

### Estratégia de Backup

```
┌─────────────────────────────────────────────────────────────┐
│                    Backup Strategy                          │
├─────────────────────────────────────────────────────────────┤
│  Frequência    │  Tipo        │  Retenção   │  Local       │
├─────────────────────────────────────────────────────────────┤
│  A cada hora   │  Incremental │  24 horas   │  S3 Primary  │
│  Diário        │  Full        │  30 dias    │  S3 Primary  │
│  Semanal       │  Full        │  90 dias    │  S3 + Glacier│
│  Mensal        │  Full        │  1 ano      │  Glacier     │
└─────────────────────────────────────────────────────────────┘
```

### Disaster Recovery

- **RPO (Recovery Point Objective)**: 1 hora
- **RTO (Recovery Time Objective)**: 4 horas
- **Replicação geográfica**: Multi-region
- **Testes de restore**: Mensais

---

## 🔍 Monitoramento

### Alertas de Segurança

- Tentativas de login falhas (> 5)
- Acesso de IP suspeito
- Exportação massiva de dados
- Alterações em permissões
- Erros de criptografia

### Ferramentas

- **SIEM**: Integração com Datadog/Splunk
- **Vulnerability Scanning**: Dependabot, Snyk
- **Penetration Testing**: Trimestral
- **Code Review**: Obrigatório para PRs

---

## 📞 Resposta a Incidentes

### Processo

1. **Detecção** - Alertas automáticos
2. **Contenção** - Isolamento do sistema
3. **Investigação** - Análise de logs
4. **Erradicação** - Correção da vulnerabilidade
5. **Recuperação** - Restore de backup
6. **Lições aprendidas** - Post-mortem

### Comunicação

- Notificação à ANPD em até 72h (se aplicável)
- Comunicação aos titulares afetados
- Relatório interno de incidente

---

## ✅ Checklist de Segurança

### Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Secrets em vault seguro
- [ ] SSL/TLS configurado
- [ ] Headers de segurança ativos
- [ ] Rate limiting configurado
- [ ] Backup testado
- [ ] Logs configurados
- [ ] Monitoramento ativo

### Código

- [ ] Sem credenciais hardcoded
- [ ] Validação de input
- [ ] Sanitização de output
- [ ] Prepared statements
- [ ] CSRF protection
- [ ] Dependências atualizadas
