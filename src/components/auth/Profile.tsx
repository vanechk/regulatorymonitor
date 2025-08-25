import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { User, FileSpreadsheet, Hash, Calendar, TrendingUp, Mail } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  region?: string;
  themeColor?: string;
  themeMode: 'light' | 'dark';
}

interface ProfileProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onChangePassword: (currentPassword: string, newPassword: string) => void;
  onDeleteAccount: (password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function Profile({ 
  user, 
  onUpdateProfile, 
  onChangePassword, 
  onDeleteAccount, 
  isLoading = false, 
  error 
}: ProfileProps) {
  // Моковые данные для счетчиков (в реальном приложении эти данные должны приходить с сервера)
  const [stats, setStats] = useState({
    reportsSent: 42,
    keywordsCount: 15,
    sourcesCount: 8,
    newsProcessed: 1250
  });

  // Обновляем статистику при изменении пользователя
  useEffect(() => {
    // Здесь можно загрузить реальную статистику с сервера
    console.log('Profile updated:', user);
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Личный кабинет</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Информация о пользователе */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Информация о пользователе
          </CardTitle>
          <CardDescription>
            Ваши личные данные и настройки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Имя пользователя</label>
              <p className="text-lg font-semibold">{user.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-lg font-semibold">{user.email || 'Не указано'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Имя</label>
              <p className="text-lg font-semibold">{user.firstName || 'Не указано'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Фамилия</label>
              <p className="text-lg font-semibold">{user.lastName || 'Не указано'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Регион</label>
              <p className="text-lg font-semibold">{user.region || 'Не указано'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отчётов отправлено</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsSent}</div>
            <p className="text-xs text-muted-foreground">
              +12% с прошлого месяца
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ключевых слов</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.keywordsCount}</div>
            <p className="text-xs text-muted-foreground">
              Активных мониторинг
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Источников</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sourcesCount}</div>
            <p className="text-xs text-muted-foreground">
              Подключено источников
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новостей обработано</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newsProcessed}</div>
            <p className="text-xs text-muted-foreground">
              За последние 30 дней
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
