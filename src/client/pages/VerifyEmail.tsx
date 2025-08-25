import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft, PartyPopper, Shield, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/button';

export function VerifyEmail() {
  console.log('🔍 VerifyEmail: Компонент начал рендеринг');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const token = searchParams.get('token');
  
  console.log('🔍 VerifyEmail: URL параметры:', {
    token: token ? `${token.substring(0, 20)}...` : 'отсутствует',
    fullUrl: window.location.href,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  useEffect(() => {
    console.log('🔍 VerifyEmail: useEffect сработал');
    console.log('🔍 VerifyEmail: Токен из URL:', token ? 'найден' : 'не найден');
    
    if (!token) {
      console.log('❌ VerifyEmail: Токен отсутствует, устанавливаю ошибку');
      setStatus('error');
      setMessage('Токен подтверждения не найден');
      return;
    }

    // Проверяем, не был ли уже выполнен запрос
    if (status !== 'loading') {
      console.log('🔍 VerifyEmail: Запрос уже выполнен, пропускаю');
      return;
    }

    console.log('✅ VerifyEmail: Токен найден, начинаю проверку');
    
    // Флаг для предотвращения повторных запросов
    let isRequestCompleted = false;
    
    const verifyToken = async () => {
      console.log('🔄 VerifyEmail: Начинаю асинхронную проверку токена');
      console.log('🔍 VerifyEmail: Токен для проверки:', token ? `${token.substring(0, 20)}...` : 'отсутствует');
      
      try {
        // Сначала проверяем статус пользователя
        console.log('📡 VerifyEmail: Проверяю статус пользователя...');
        const statusResponse = await fetch('/api/auth/check-verification-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        const statusData = await statusResponse.json();
        console.log('📡 VerifyEmail: Статус пользователя:', statusData);
        
        // Проверяем, не был ли уже выполнен запрос
        if (isRequestCompleted) {
          console.log('🔍 VerifyEmail: Запрос уже был выполнен, пропускаю обработку');
          return;
        }
        
        isRequestCompleted = true;
        
        if (statusData.status === 'success') {
          // Пользователь уже подтвержден или успешно подтвержден
          console.log('✅ VerifyEmail: Пользователь уже подтвержден');
          setStatus('success');
          setMessage(statusData.message || 'Email уже подтвержден. Вы можете войти в систему.');
          setUserInfo(statusData.user);
          return;
        }
        
        if (statusData.status === 'pending') {
          // Пользователь готов к подтверждению, выполняем верификацию
          console.log('📡 VerifyEmail: Выполняю верификацию...');
          const verifyResponse = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          
          const verifyData = await verifyResponse.json();
          console.log('📡 VerifyEmail: Результат верификации:', verifyData);
          
          if (verifyData.message && !verifyData.error) {
            console.log('✅ VerifyEmail: Верификация успешна');
            setStatus('success');
            setMessage(verifyData.message);
            setUserInfo(verifyData.user || {
              id: verifyData.userId,
              username: statusData.user?.username,
              email: statusData.user?.email,
              isVerified: true
            });
          } else {
            console.log('❌ VerifyEmail: Ошибка верификации');
            
            // Проверяем, возможно пользователь уже был подтвержден
            if (verifyData.error && verifyData.error.includes('уже подтвержден')) {
              console.log('✅ VerifyEmail: Пользователь уже подтвержден (из сообщения об ошибке)');
              setStatus('success');
              setMessage('Email уже подтвержден. Вы можете войти в систему.');
              setUserInfo(verifyData.user || {
                id: verifyData.userId,
                username: statusData.user?.username,
                email: statusData.user?.email,
                isVerified: true
              });
            } else {
              setStatus('error');
              setMessage(verifyData.error || 'Ошибка при подтверждении email');
            }
          }
          return;
        }
        
        if (statusData.status === 'invalid') {
          // Токен недействителен
          console.log('❌ VerifyEmail: Токен недействителен');
          setStatus('error');
          setMessage(statusData.error || 'Токен подтверждения недействителен');
          return;
        }
        
        // Неизвестный статус
        console.log('❌ VerifyEmail: Неизвестный статус');
        setStatus('error');
        setMessage('Неизвестный статус верификации');
        
      } catch (error) {
        console.error('❌ VerifyEmail: Ошибка при проверке токена:', error);
        
        // Проверяем, не был ли уже выполнен запрос
        if (isRequestCompleted) {
          console.log('🔍 VerifyEmail: Запрос уже был выполнен, пропускаю обработку ошибки');
          return;
        }
        
        isRequestCompleted = true;
        
        console.error('❌ VerifyEmail: Детали ошибки:', {
          message: error instanceof Error ? error.message : 'Неизвестная ошибка',
          stack: error instanceof Error ? error.stack : 'Нет стека',
          name: error instanceof Error ? error.name : 'Неизвестный тип ошибки'
        });
        
        setStatus('error');
        setMessage('Ошибка при проверке токена. Попробуйте зарегистрироваться снова.');
      }
    };

    console.log('🚀 VerifyEmail: Вызываю функцию verifyToken');
    verifyToken();
    
    console.log('🔍 VerifyEmail: useEffect завершен');
  }, [token, status]);

  const handleBackToLogin = () => {
    console.log('🔍 VerifyEmail: Пользователь нажал "Перейти к входу"');
    console.log('🔍 VerifyEmail: Переход на /auth');
    navigate('/auth');
  };

  const handleBackToRegistration = () => {
    console.log('🔍 VerifyEmail: Пользователь нажал "Вернуться к регистрации"');
    navigate('/auth?mode=register');
  };

  console.log('🔍 VerifyEmail: Текущий статус:', status);
  console.log('🔍 VerifyEmail: Текущее сообщение:', message);

  const renderContent = () => {
    console.log('🔍 VerifyEmail: renderContent вызван, статус:', status);
    
    switch (status) {
      case 'loading':
        console.log('🔍 VerifyEmail: Рендерю состояние загрузки');
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
              className="mb-6 relative"
            >
              <div className="bg-gradient-to-r from-blue-400 to-indigo-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg relative overflow-hidden"
                style={{
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Эффект свечения */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              </div>
              
              {/* Декоративные элементы для загрузки */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-1 -right-1"
              >
                <div className="w-3 h-3 bg-blue-300 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(147, 197, 253, 0.3)'
                  }}
                ></div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-1 -left-1"
              >
                <div className="w-4 h-4 bg-indigo-300 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(165, 180, 252, 0.3)'
                  }}
                ></div>
              </motion.div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 mb-3 relative"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Подтверждение email
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg relative"
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              Проверяем ваш токен подтверждения...
            </motion.p>
            
            {/* Анимированные точки */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center space-x-2 mt-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-blue-500 rounded-full relative"
                  style={{
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}
                />
              ))}
            </motion.div>
          </div>
        );

      case 'success':
        console.log('🔍 VerifyEmail: Рендерю состояние успеха');
        
        return (
          <div className="text-center">
            {/* Анимированная иконка успеха */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.2
              }}
              className="relative mb-6"
            >
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg relative overflow-hidden"
                style={{
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Эффект свечения */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              
              {/* Декоративные элементы */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2"
              >
                <PartyPopper className="h-6 w-6 text-yellow-500" />
              </motion.div>
              
              {/* Дополнительные декоративные элементы */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className="absolute -bottom-1 -left-1"
              >
                <div className="w-4 h-4 bg-pink-400 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)'
                  }}
                ></div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                className="absolute -top-1 -left-1"
              >
                <div className="w-3 h-3 bg-blue-400 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(96, 165, 250, 0.3)'
                  }}
                ></div>
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-3 relative"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Email подтвержден!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6 text-lg relative"
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              {message}
            </motion.p>
            
            {/* Информационная карточка */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 20px rgba(34, 197, 94, 0.1)'
                }}
              >
                {/* Эффект свечения */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-emerald-100/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-3">
                    <UserCheck className="h-6 w-6 text-green-600 mr-2" />
                    <span className="text-green-800 font-semibold">Аккаунт готов к использованию</span>
                  </div>
                  <p className="text-sm text-green-700">
                    🎉 Ваш email успешно подтвержден! Теперь вы можете войти в систему и использовать все возможности TaxNewsRadar.
                  </p>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Кнопка входа */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 0.6,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden"
              >
                <Button 
                  onClick={handleBackToLogin}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 30px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {/* Эффект свечения */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Войти в систему
                  </div>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        );

      case 'error':
        console.log('🔍 VerifyEmail: Рендерю состояние ошибки');
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
              className="mb-6 relative"
            >
              <div className="bg-gradient-to-r from-red-400 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg relative overflow-hidden"
                style={{
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Эффект свечения */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <XCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              
              {/* Декоративные элементы для ошибки */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-1 -right-1"
              >
                <div className="w-3 h-3 bg-red-300 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(252, 165, 165, 0.3)'
                  }}
                ></div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-1 -left-1"
              >
                <div className="w-4 h-4 bg-pink-300 rounded-full opacity-80"
                  style={{
                    boxShadow: '0 2px 4px rgba(251, 207, 232, 0.3)'
                  }}
                ></div>
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 mb-3 relative"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Ошибка подтверждения
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 mb-6 text-lg relative"
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              {message}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 0.4,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="space-y-4"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden"
              >
                <Button 
                  onClick={handleBackToRegistration}
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-3 text-lg font-medium transition-all duration-300 relative overflow-hidden"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 20px rgba(156, 163, 175, 0.1)'
                  }}
                >
                  {/* Эффект свечения */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Вернуться к регистрации
                  </div>
                </Button>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-500 px-4 relative"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                Если проблема повторяется, попробуйте зарегистрироваться снова
              </motion.p>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden"
              >
                <Button 
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 py-3 text-lg font-medium transition-all duration-300 relative overflow-hidden"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {/* Эффект свечения */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Перейти к входу в систему
                  </div>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        );
    }
  };

  console.log('🔍 VerifyEmail: Начинаю рендер JSX');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновые декоративные элементы */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute inset-0 pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ delay: 1.2, duration: 2 }}
          className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full blur-3xl"
          style={{
            boxShadow: '0 0 40px rgba(147, 197, 253, 0.3)'
          }}
        ></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ delay: 1.4, duration: 2 }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200 rounded-full blur-3xl"
          style={{
            boxShadow: '0 0 50px rgba(165, 180, 252, 0.3)'
          }}
        ></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ delay: 1.6, duration: 2 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200 rounded-full blur-3xl"
          style={{
            boxShadow: '0 0 60px rgba(196, 181, 253, 0.3)'
          }}
        ></motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/20 relative z-10"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 40px rgba(59, 130, 246, 0.1)'
        }}
      >
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8 relative"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden"
            style={{
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Эффект свечения */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <Mail className="h-10 w-10 text-white" />
            </div>
            
            {/* Декоративные элементы для заголовка */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="absolute -top-1 -right-1"
            >
              <div className="w-3 h-3 bg-blue-300 rounded-full opacity-80"
                style={{
                  boxShadow: '0 2px 4px rgba(147, 197, 253, 0.3)'
                }}
              ></div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="absolute -bottom-1 -left-1"
            >
              <div className="w-4 h-4 bg-indigo-300 rounded-full opacity-80"
                style={{
                  boxShadow: '0 2px 4px rgba(165, 180, 252, 0.3)'
                }}
              ></div>
            </motion.div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 relative"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            TaxNewsRadar
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-lg relative"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            Подтверждение регистрации
          </motion.p>
        </motion.div>

        {/* Основной контент */}
        {renderContent()}

        {/* Отладочная информация (только в режиме разработки) */}
        {process.env.NODE_ENV === 'development' && token && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.8,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="mt-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 relative overflow-hidden"
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 20px rgba(156, 163, 175, 0.05)'
            }}
          >
            {/* Эффект свечения */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="text-xs text-gray-500 text-center font-mono relative"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                Токен: {token.substring(0, 20)}...
              </motion.p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
