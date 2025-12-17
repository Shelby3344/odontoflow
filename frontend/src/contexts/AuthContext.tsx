import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  professional_id?: string;
  specialty?: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('@OdontoFlow:token');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function loadUser() {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch {
      localStorage.removeItem('@OdontoFlow:token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    
    const { token, user: userData } = response.data;
    
    localStorage.setItem('@OdontoFlow:token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(userData);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('@OdontoFlow:token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }

  function updateUser(data: Partial<User>) {
    if (user) {
      setUser({ ...user, ...data });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
