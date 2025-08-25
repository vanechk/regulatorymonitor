import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Проверяем системную тему
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Удаляем предыдущие классы темы
    root.classList.remove('light', 'dark');
    
    // Добавляем новый класс темы
    root.classList.add(theme);
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
