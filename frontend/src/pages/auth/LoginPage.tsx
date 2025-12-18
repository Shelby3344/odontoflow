import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="branding-logo">
              <svg viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#login-logo-gradient)" />
                <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 21c-4.95 0-9-4.05-9-9s4.05-9 9-9 9 4.05 9 9-4.05 9-9 9z" fill="white" />
                <circle cx="24" cy="24" r="4.5" fill="white" />
                <defs>
                  <linearGradient id="login-logo-gradient" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </svg>
              <span>OdontoFlow</span>
            </div>
            <h1 className="branding-title">
              Gestão odontológica<br />
              <span>inteligente e moderna</span>
            </h1>
            <p className="branding-description">
              Simplifique a gestão da sua clínica com IA, agenda inteligente, 
              prontuário digital e muito mais.
            </p>
            <div className="branding-features">
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Agenda com IA preditiva</span>
              </div>
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Odontograma interativo</span>
              </div>
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Financeiro completo</span>
              </div>
              <div className="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span>Relatórios avançados</span>
              </div>
            </div>
          </div>
          <div className="branding-footer">
            <p>© 2024 OdontoFlow. Todos os direitos reservados.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h2>Bem-vindo de volta</h2>
              <p>Entre com suas credenciais para acessar o sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                fullWidth
                leftIcon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                }
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                leftIcon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Lembrar de mim</span>
                </label>
                <a href="/forgot-password" className="forgot-password">
                  Esqueceu a senha?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
              >
                Entrar
              </Button>
            </form>

            <div className="login-demo">
              <p>Credenciais de demonstração:</p>
              <div className="demo-credentials">
                <button onClick={() => { setEmail('admin@odontoflow.com.br'); setPassword('admin123'); }}>
                  Admin
                </button>
                <button onClick={() => { setEmail('dentista@odontoflow.com.br'); setPassword('dentista123'); }}>
                  Dentista
                </button>
                <button onClick={() => { setEmail('recepcao@odontoflow.com.br'); setPassword('recepcao123'); }}>
                  Recepção
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
