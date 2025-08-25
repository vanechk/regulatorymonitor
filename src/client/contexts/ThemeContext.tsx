import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  resetToDefaultTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Базовая тема по умолчанию
  const DEFAULT_THEME_COLOR = '220 85% 45%';
  
  const { user, updateProfile } = useAuth();
  
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // По умолчанию светлая тема
    return 'light';
  });

  const [themeColor, setThemeColor] = useState<string>(() => {
    // Приоритет: профиль пользователя > localStorage > значение по умолчанию
    if (user?.themeColor) {
      return user.themeColor;
    }
    return localStorage.getItem('themeColor') || DEFAULT_THEME_COLOR;
  });

  // Debouncing для обновления CSS переменных
  const [debouncedThemeColor, setDebouncedThemeColor] = useState(themeColor);

  // Синхронизируем цвет темы с профилем пользователя
  useEffect(() => {
    if (user?.themeColor && user.themeColor !== themeColor) {
      setThemeColor(user.themeColor);
    }
  }, [user?.themeColor]);

  // Debouncing эффект
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedThemeColor(themeColor);
    }, 300); // 300ms задержка

    return () => clearTimeout(timer);
  }, [themeColor]);

  // Функция сброса к базовой теме
  const resetToDefaultTheme = () => {
    setThemeColor(DEFAULT_THEME_COLOR);
    localStorage.setItem('themeColor', DEFAULT_THEME_COLOR);
    
    // Обновляем профиль пользователя только при явном вызове
    if (user) {
      // Используем setTimeout чтобы избежать конфликтов с состоянием
      setTimeout(() => {
        updateProfile({ themeColor: DEFAULT_THEME_COLOR }).catch(console.error);
      }, 100);
    }
  };

  // Обновляем тему
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Удаляем предыдущие классы темы
    root.classList.remove('light', 'dark');
    
    // Добавляем новый класс темы
    root.classList.add(theme);
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Обновляем цвет темы (с debouncing)
  useEffect(() => {
    console.log('ThemeContext: Обновление цвета темы на:', debouncedThemeColor);
    
    // Обновляем CSS переменные для цвета темы
    const root = window.document.documentElement;
    
    // Основные цвета темы
    root.style.setProperty('--primary', `hsl(${debouncedThemeColor})`);
    root.style.setProperty('--accent', `hsl(${debouncedThemeColor})`);
    root.style.setProperty('--ring', `hsl(${debouncedThemeColor})`);
    
    // Дополнительные цвета на основе основного
    const [h, s, l] = debouncedThemeColor.split(' ').map(Number);
    
    // Более светлые варианты
    root.style.setProperty('--primary-light', `hsl(${h}, ${s}%, ${Math.min(l + 20, 95)}%)`);
    root.style.setProperty('--primary-lighter', `hsl(${h}, ${s}%, ${Math.min(l + 40, 98)}%)`);
    
    // Более темные варианты
    root.style.setProperty('--primary-dark', `hsl(${h}, ${s}%, ${Math.max(l - 20, 5)}%)`);
    root.style.setProperty('--primary-darker', `hsl(${h}, ${s}%, ${Math.max(l - 40, 2)}%)`);
    
    // Дополнительные цвета для полного покрытия интерфейса
    root.style.setProperty('--primary-foreground', `hsl(${h}, ${s}%, ${l > 50 ? 10 : 90}%)`);
    root.style.setProperty('--accent-foreground', `hsl(${h}, ${s}%, ${l > 50 ? 10 : 90}%)`);
    
    // Цвета для hover эффектов
    root.style.setProperty('--primary-hover', `hsl(${h}, ${s}%, ${Math.max(l - 10, 5)}%)`);
    root.style.setProperty('--accent-hover', `hsl(${h}, ${s}%, ${Math.max(l - 10, 5)}%)`);
    
    // Цвета для фокуса и выделения
    root.style.setProperty('--focus', `hsl(${h}, ${s}%, ${l}%)`);
    root.style.setProperty('--selection', `hsl(${h}, ${s}%, ${Math.min(l + 30, 95)}%)`);
    
    // Принудительно обновляем стили
    root.style.setProperty('--primary', `hsl(${debouncedThemeColor})`, 'important');
    
    // Сохраняем в localStorage
    localStorage.setItem('themeColor', debouncedThemeColor);
    
    // Принудительно обновляем все элементы, использующие CSS переменные
    setTimeout(() => {
      // Обновляем все элементы с классами темы
      const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
      
      elements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Триггерим перерисовку
          element.style.transform = 'translateZ(0)';
          setTimeout(() => {
            element.style.transform = '';
          }, 10);
        }
      });
      
      // Отправляем событие изменения темы
      const event = new Event('themeChange');
      window.dispatchEvent(event);
      
      // Принудительно обновляем computed styles
      document.body.style.setProperty('--force-update', Date.now().toString());
      
      console.log('ThemeContext: Принудительное обновление завершено');
    }, 100);
    
    console.log('ThemeContext: Цвет темы обновлен:', debouncedThemeColor);
    console.log('ThemeContext: CSS переменные установлены:', {
      primary: root.style.getPropertyValue('--primary'),
      accent: root.style.getPropertyValue('--accent'),
      ring: root.style.getPropertyValue('--ring'),
      'primary-light': root.style.getPropertyValue('--primary-light'),
      'primary-hover': root.style.getPropertyValue('--primary-hover')
    });
  }, [debouncedThemeColor]); // Используем debounced значение

  const value: ThemeContextType = {
    theme,
    setTheme,
    themeColor,
    setThemeColor,
    resetToDefaultTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
