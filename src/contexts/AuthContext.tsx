import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../client/utils';

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  region?: string;
  themeColor?: string;
  themeMode: 'light' | 'dark';
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, onSuccess?: () => void) => Promise<string>;
  deleteAccount: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  console.log('🔍 useAuth: Хук вызван');
  const context = useContext(AuthContext);
  console.log('🔍 useAuth: useContext(AuthContext) вернул:', context);
  
  if (context === undefined) {
    console.error('❌ useAuth: Контекст не определен! useAuth должен использоваться внутри AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('✅ useAuth: Контекст успешно получен');
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🔍 AuthProvider: Компонент начал рендериться');
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true); // Начинаем с true
  const [error, setError] = useState<string | null>(null);
  
  console.log('🔍 AuthProvider: Состояние инициализировано:', { user, token, isLoading, error });

  // Проверяем токен при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          // Ошибка при получении профиля - очищаем токен
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false); // Завершаем загрузку в любом случае
    };

    checkAuth();
  }, [token]);

  const fetchProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Токен недействителен
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error; // Пробрасываем ошибку для обработки в checkAuth
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // Клиентская валидация
    if (!username || !username.trim()) {
      setError('Имя пользователя или email обязательно');
      setIsLoading(false);
      throw new Error('Имя пользователя или email обязательно');
    }
    
    if (!password || !password.trim()) {
      setError('Пароль обязателен');
      setIsLoading(false);
      throw new Error('Пароль обязателен');
    }

    try {
      // Определяем, что передавать: email или username
      const isEmail = username.includes('@');
      const requestBody = isEmail 
        ? { email: username, password }
        : { username, password };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем полные данные пользователя из ответа сервера
        setUser(data.user);
        setToken(data.tokens.accessToken); // Используем accessToken из tokens
        localStorage.setItem('token', data.tokens.accessToken);
        
        // Показываем уведомление об успешном входе
        const { toast } = useToast();
        toast({
          title: '🎉 Вход выполнен успешно!',
          description: `Добро пожаловать, ${data.user.username}!`,
          variant: 'success',
          icon: '🚀'
        });
        
        // Дополнительно получаем актуальный профиль для обновления данных
        try {
          await fetchProfile();
        } catch (profileError) {
          console.warn('Не удалось получить дополнительный профиль:', profileError);
          // Не критично, основные данные уже есть
        }
      } else {
        setError(data.error || 'Ошибка при входе');
        
        // Показываем уведомление об ошибке
        const { toast } = useToast();
        toast({
          title: '❌ Ошибка входа',
          description: data.error || 'Неверное имя пользователя или пароль',
          variant: 'destructive',
          icon: '🚫'
        });
        
        throw new Error(data.error || 'Ошибка при входе');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при входе');
      
      // Показываем уведомление об ошибке
      const { toast } = useToast();
      toast({
        title: '❌ Ошибка входа',
        description: error.message || 'Произошла ошибка при входе в систему',
        variant: 'destructive',
        icon: '🚫'
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Регистрация успешна, но пользователь не подтвержден
        // Не устанавливаем токен и пользователя, пока email не подтвержден
        setError(null);
        
        // Показываем уведомление об успешной регистрации
        const { toast } = useToast();
        toast({
          title: '🎉 Регистрация успешна!',
          description: 'Проверьте email для подтверждения аккаунта',
          variant: 'success',
          icon: '📧'
        });
        
        // Возвращаем сообщение об успешной регистрации
        return data.message;
      } else {
        setError(data.error || 'Ошибка при регистрации');
        
        // Показываем уведомление об ошибке
        const { toast } = useToast();
        toast({
          title: '❌ Ошибка регистрации',
          description: data.error || 'Не удалось зарегистрировать аккаунт',
          variant: 'destructive',
          icon: '🚫'
        });
        
        throw new Error(data.error || 'Ошибка при регистрации');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при регистрации');
      
      // Показываем уведомление об ошибке
      const { toast } = useToast();
      toast({
        title: '❌ Ошибка регистрации',
        description: error.message || 'Произошла ошибка при регистрации',
        variant: 'destructive',
        icon: '🚫'
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    
    // Показываем уведомление о выходе
    const { toast } = useToast();
    toast({
      title: '👋 До свидания!',
      description: 'Вы успешно вышли из системы',
      variant: 'default',
      icon: '🚪'
    });
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) throw new Error('Не авторизован');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Сервер вернул неверный формат ответа');
      }

      const userData = await response.json();

      if (response.ok) {
        // Проверяем структуру ответа
        if (userData.user) {
          setUser(userData.user);
        } else {
          setUser(userData);
        }
      } else {
        setError(userData.error || 'Ошибка при обновлении профиля');
        throw new Error(userData.error || 'Ошибка при обновлении профиля');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при обновлении профиля');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, onSuccess?: () => void) => {
    if (!token) throw new Error('Не авторизован');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Сервер вернул неверный формат ответа');
      }

      const data = await response.json();

      if (response.ok) {
        // Пароль успешно изменен - выходим из системы
        logout();
        
        // Вызываем callback для перенаправления, если он передан
        if (onSuccess) {
          onSuccess();
        }
        
        return data.message || 'Пароль успешно изменен. Необходимо войти заново.';
      } else {
        setError(data.error || 'Ошибка при изменении пароля');
        throw new Error(data.error || 'Ошибка при изменении пароля');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при изменении пароля');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    if (!token) throw new Error('Не авторизован');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Сервер вернул неверный формат ответа');
      }

      const data = await response.json();

      if (response.ok) {
        logout();
      } else {
        setError(data.error || 'Ошибка при удалении аккаунта');
        throw new Error(data.error || 'Ошибка при удалении аккаунта');
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка при удалении аккаунта');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    isLoading,
    error,
  };

  console.log('🔍 AuthProvider: Рендерю AuthContext.Provider с значением:', value);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
