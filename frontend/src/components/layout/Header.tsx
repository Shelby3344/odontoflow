import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'Novo agendamento', message: 'Maria Silva agendou para amanhã às 14h', time: '5 min', unread: true },
    { id: 2, title: 'Pagamento recebido', message: 'R$ 350,00 de João Pedro', time: '1h', unread: true },
    { id: 3, title: 'Lembrete', message: '3 pacientes aguardando confirmação', time: '2h', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        
        <div className="header-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar pacientes, agendamentos..."
            className="search-input"
          />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Actions */}
        <button className="header-action-btn header-action-primary" onClick={() => navigate('/schedule/new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Novo Agendamento</span>
        </button>

        {/* Theme Toggle */}
        <button className="header-icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}>
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>

        {/* Notifications */}
        <div className="header-dropdown" ref={notifRef}>
          <button
            className="header-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="dropdown-header">
                <h4>Notificações</h4>
                <button className="dropdown-action">Marcar todas como lidas</button>
              </div>
              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notification-item ${notif.unread ? 'notification-unread' : ''}`}>
                    <div className="notification-content">
                      <span className="notification-title">{notif.title}</span>
                      <span className="notification-message">{notif.message}</span>
                    </div>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button onClick={() => navigate('/notifications')}>Ver todas</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="header-dropdown" ref={userMenuRef}>
          <button
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <svg className="user-menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu user-menu">
              <div className="user-menu-header">
                <div className="user-avatar-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-menu-info">
                  <span className="user-menu-name">{user?.name}</span>
                  <span className="user-menu-email">{user?.email}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => navigate('/settings/profile')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </button>
              <button className="dropdown-item" onClick={() => navigate('/settings')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configurações
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
