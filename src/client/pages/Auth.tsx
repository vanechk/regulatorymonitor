import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Users, CheckCircle, BarChart3 } from 'lucide-react';

type AuthMode = 'login' | 'register';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const { login, register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      // Ошибка уже обрабатывается в контексте
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      const message = await register(username, email, password);
      setSuccessMessage(message);
      setRegisteredEmail(email);
      
      // ✅ Переключаемся на страницу входа для безопасности
      // Это предотвращает отображение пароля на странице регистрации
      setMode('login');
      
      // Очищаем сообщение об успехе через 5 секунд
      setTimeout(() => {
        setSuccessMessage(null);
        setRegisteredEmail(null);
      }, 5000);
      
    } catch (error) {
      // Ошибка уже обрабатывается в контексте
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
      } else {
        // Показываем ошибку
        setSuccessMessage(null);
        // Здесь можно добавить состояние для ошибки
      }
    } catch (error) {
      console.error('Error resending verification:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Левая панель с информацией */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* Анимированные фоны */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">TaxNewsRadar</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Мониторинг налоговых новостей
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Получайте актуальную информацию о налоговых изменениях, новостях и документах в режиме реального времени.
          </p>

          <div className="space-y-6">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Безопасность</h3>
                <p className="text-blue-100 text-sm">Защищенные данные и конфиденциальность</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Актуальность</h3>
                <p className="text-blue-100 text-sm">Новости в реальном времени</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Персонализация</h3>
                <p className="text-blue-100 text-sm">Настройки под ваши потребности</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Правая панель с формами */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8"
          >
            {/* Переключатель режимов */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Вход
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                  mode === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Сообщение об успешной регистрации */}
            {successMessage && mode === 'login' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
                
                {/* Кнопка повторной отправки письма */}
                <div className="mt-4">
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                    disabled={isLoading}
                  >
                    Отправить письмо повторно
                  </Button>
                </div>
                
                {/* Дополнительная информация для пользователя */}
                <div className="mt-3 text-sm text-green-700 text-center">
                  Теперь вы можете войти в систему после подтверждения email
                </div>
              </motion.div>
            )}

            {/* Ошибка */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Формы */}
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm onLogin={handleLogin} isLoading={isLoading} />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RegisterForm 
                    onRegister={handleRegister} 
                    isLoading={isLoading}
                    onSuccess={() => {
                      // ✅ Дополнительная логика после успешной регистрации
                      console.log('✅ Форма регистрации очищена и переключение на вход выполнено');
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
