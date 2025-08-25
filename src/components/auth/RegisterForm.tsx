import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, Check, X, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onRegister: (username: string, email: string, password: string) => void;
  isLoading?: boolean;
  onSuccess?: () => void; // ✅ Добавляем callback для успешной регистрации
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  
  if (username.length < 6) {
    errors.push('Имя пользователя должно содержать минимум 6 символов');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Имя пользователя может содержать только латинские буквы, цифры и символ подчеркивания');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Введите корректный email адрес');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 цифру');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 заглавную букву');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать минимум 1 специальный символ');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function RegisterForm({ onRegister, isLoading = false, onSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameValidation, setUsernameValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [emailValidation, setEmailValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [passwordValidation, setPasswordValidation] = useState<ValidationResult>({ isValid: true, errors: [] });

  // ✅ Функция очистки формы
  const clearForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setUsernameValidation({ isValid: true, errors: [] });
    setEmailValidation({ isValid: true, errors: [] });
    setPasswordValidation({ isValid: true, errors: [] });
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length > 0) {
      setUsernameValidation(validateUsername(value));
    } else {
      setUsernameValidation({ isValid: true, errors: [] });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.length > 0) {
      setEmailValidation(validateEmail(value));
    } else {
      setEmailValidation({ isValid: true, errors: [] });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordValidation(validatePassword(value));
    } else {
      setPasswordValidation({ isValid: true, errors: [] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const usernameValid = validateUsername(username);
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    
    setUsernameValidation(usernameValid);
    setEmailValidation(emailValid);
    setPasswordValidation(passwordValid);
    
    if (password !== confirmPassword) {
      return;
    }
    
    if (usernameValid.isValid && emailValid.isValid && passwordValid.isValid && password === confirmPassword) {
      onRegister(username.trim(), email.trim(), password);
      
      // ✅ Очищаем форму после успешной регистрации
      clearForm();
      
      // ✅ Вызываем callback успешной регистрации
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const isFormValid = usernameValidation.isValid && 
                     emailValidation.isValid && 
                     passwordValidation.isValid && 
                     password === confirmPassword && 
                     username.trim() && 
                     email.trim() && 
                     password.trim() && 
                     confirmPassword.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Создать аккаунт</h2>
          <p className="text-gray-600 mt-2">
            Заполните форму для регистрации в системе
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Имя пользователя
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Введите имя пользователя"
                required
                disabled={isLoading}
                className={`pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white/50 backdrop-blur-sm ${
                  usernameValidation.errors.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {usernameValidation.errors.length > 0 && (
              <div className="text-red-600 text-sm space-y-1">
                {usernameValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Введите email"
                required
                disabled={isLoading}
                className={`pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white/50 backdrop-blur-sm ${
                  emailValidation.errors.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {emailValidation.errors.length > 0 && (
              <div className="text-red-600 text-sm space-y-1">
                {emailValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
                className={`pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white/50 backdrop-blur-sm ${
                  passwordValidation.errors.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {passwordValidation.errors.length > 0 && (
              <div className="text-red-600 text-sm space-y-1">
                {passwordValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Подтвердите пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                required
                disabled={isLoading}
                className={`pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white/50 backdrop-blur-sm ${
                  password !== confirmPassword && confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {password !== confirmPassword && confirmPassword && (
              <div className="text-red-600 text-sm flex items-center gap-1">
                <X className="h-3 w-3" />
                Пароли не совпадают
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Регистрация...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Зарегистрироваться
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
