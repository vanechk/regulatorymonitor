import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Home, Settings, FileSpreadsheet, Calendar, User, LogOut, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

function Layout({ children }: { children: React.ReactNode }) {
  console.log('🔍 Layout: Компонент начал рендериться');
  
  const location = useLocation();
  console.log('🔍 Layout: useLocation() вызван, pathname:', location.pathname);
  
  const navigate = useNavigate();
  console.log('🔍 Layout: useNavigate() вызван');
  
  console.log('🔍 Layout: Пытаюсь вызвать useAuth()...');
  const { user, logout } = useAuth();
  console.log('🔍 Layout: useAuth() успешно вызван, user:', user);
  
  console.log('🔍 Layout: Пытаюсь вызвать useTheme()...');
  const { theme } = useTheme();
  console.log('🔍 Layout: useTheme() успешно вызван, theme:', theme);
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  console.log('🔍 Layout: useState() успешно вызван');

  // Слушаем изменения темы для принудительного обновления стилей
  useEffect(() => {
    const handleThemeChange = () => {
      console.log('Layout: Получено событие изменения темы');
      
      // Принудительно обновляем стили всех элементов
      const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
      
      console.log('Layout: Найдено элементов для обновления:', elements.length);
      
      elements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Триггерим перерисовку
          element.style.transform = 'translateZ(0)';
          setTimeout(() => {
            element.style.transform = '';
          }, 10);
        }
      });
      
      // Принудительно обновляем computed styles
      document.body.style.setProperty('--force-update', Date.now().toString());
      
      console.log('Layout: Обновление стилей завершено');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/auth');
    setShowLogoutDialog(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  console.log('🔍 Layout: Начинаю рендерить JSX');
  
  return (
    <div className="flex min-h-screen main-container">
      <aside className="w-64 sidebar p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold heading-primary mb-8">TaxNewsRadar</h1>
          <nav className="space-y-2">
            <Link 
              to="/" 
              className={`nav-link flex items-center gap-2 p-2 rounded-md transition-colors ${
                location.pathname === '/' ? 'active' : 'hover:bg-accent'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Дашборд</span>
            </Link>
            <Link 
              to="/reports" 
              className={`nav-link flex items-center gap-2 p-2 rounded-md transition-colors ${
                location.pathname === '/reports' ? 'active' : 'hover:bg-accent'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span>Отчеты</span>
            </Link>
            <Link 
              to="/calendar" 
              className={`nav-link flex items-center gap-2 p-2 rounded-md transition-colors ${
                location.pathname === '/calendar' ? 'active' : 'hover:bg-accent'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Календарь</span>
            </Link>
            <Link 
              to="/settings" 
              className={`nav-link flex items-center gap-2 p-2 rounded-md transition-colors ${
                location.pathname === '/settings' ? 'active' : 'hover:bg-accent'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Настройки</span>
            </Link>
            <Link 
              to="/profile" 
              className={`nav-link flex items-center gap-2 p-2 rounded-md transition-colors ${
                location.pathname === '/profile' ? 'active' : 'hover:bg-accent'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Личный кабинет</span>
            </Link>
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold heading-primary">
              {location.pathname === '/' && 'Дашборд'}
              {location.pathname === '/reports' && 'Отчеты'}
              {location.pathname === '/calendar' && 'Календарь'}
              {location.pathname === '/settings' && 'Настройки'}
              {location.pathname === '/profile' && 'Личный кабинет'}
            </h2>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="default"
                onClick={handleLogoutClick}
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Диалог подтверждения выхода */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Подтверждение выхода
              </div>
            </DialogTitle>
            <p className="text-gray-600 text-sm mt-2">
              Вы действительно хотите выйти из системы? Все несохраненные данные будут потеряны.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleLogoutCancel}
            >
              Отмена
            </Button>
            <Button
              onClick={handleLogoutConfirm}
            >
              Да, выйти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Layout; 