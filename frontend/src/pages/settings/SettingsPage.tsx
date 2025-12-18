import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie as configurações do sistema</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '600px' }}>
        <Card>
          <CardHeader>
            <CardTitle subtitle="Personalize a aparência do sistema">
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Tema</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {theme === 'light' ? 'Modo claro ativado' : 'Modo escuro ativado'}
                </p>
              </div>
              <Button variant="outline" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                )}
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle subtitle="Informações da clínica">
              Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
              Configurações da clínica em breve...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle subtitle="Configurações de notificações">
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
              Configurações de notificações em breve...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
