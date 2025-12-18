import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    path: '/schedule',
    label: 'Agenda',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    path: '/patients',
    label: 'Pacientes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/clinical',
    label: 'Clínico',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    children: [
      { path: '/clinical/odontogram', label: 'Odontograma' },
      { path: '/clinical/records', label: 'Prontuários' },
    ],
  },
  {
    path: '/financial',
    label: 'Financeiro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      { path: '/financial', label: 'Dashboard' },
      { path: '/financial/transactions', label: 'Transações' },
      { path: '/financial/budgets', label: 'Orçamentos' },
    ],
  },
  {
    path: '/reports',
    label: 'Relatórios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    path: '/ai',
    label: 'Assistente IA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
        <circle cx="7.5" cy="14.5" r="1.5" />
        <circle cx="16.5" cy="14.5" r="1.5" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
              <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white" />
              <circle cx="16" cy="16" r="3" fill="white" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!isCollapsed && <span className="logo-text">OdontoFlow</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.path} className="nav-item">
              {item.children ? (
                <>
                  <button
                    className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
                    onClick={() => toggleExpand(item.path)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <span className={`nav-arrow ${expandedItems.includes(item.path) ? 'nav-arrow-expanded' : ''}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </span>
                      </>
                    )}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.path) && (
                    <ul className="nav-submenu">
                      {item.children.map(child => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) => `nav-sublink ${isActive ? 'nav-sublink-active' : ''}`}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {item.badge && !isCollapsed && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Usuário'}</span>
              <span className="user-role">{user?.role || 'Admin'}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
