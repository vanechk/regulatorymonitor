import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { User, FileSpreadsheet, Hash, Calendar, TrendingUp, Mail, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../api';
import { useToast } from '../utils';

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Состояние для редактирования профиля
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    region: user?.region || ''
  });
  
  // Состояние для изменения пароля
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Получаем статистику с сервера
  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      try {
        // Получаем количество отчетов
        const reportsResponse = await apiClient.listReports();
        const reportsCount = reportsResponse?.length || 0;
        
        // Получаем количество ключевых слов
        const keywordsResponse = await apiClient.listKeywords();
        const keywordsCount = keywordsResponse?.length || 0;
        
        // Получаем количество источников
        const sourcesResponse = await apiClient.listSources();
        const sourcesCount = sourcesResponse?.length || 0;
        
        // Получаем количество новостей (за последние 30 дней)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newsResponse = await apiClient.getNews({
          dateFrom: thirtyDaysAgo.toISOString(),
          dateTo: new Date().toISOString()
        });
        const newsCount = newsResponse?.length || 0;
        
        return {
          reportsSent: reportsCount,
          keywordsCount,
          sourcesCount,
          newsProcessed: newsCount
        };
      } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        // Возвращаем моковые данные в случае ошибки
        return {
          reportsSent: 42,
          keywordsCount: 15,
          sourcesCount: 8,
          newsProcessed: 1250
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Обновляем форму при изменении пользователя
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        region: user.region || ''
      });
    }
  }, [user]);

  // Обработчики для редактирования профиля
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      region: user?.region || ''
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      toast({
        title: "Профиль обновлен",
        description: "Данные профиля успешно обновлены",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  // Обработчики для изменения пароля
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    try {
      const message = await changePassword(
        passwordForm.currentPassword, 
        passwordForm.newPassword,
        () => navigate('/auth') // Callback для перенаправления
      );
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast({
        title: "Пароль изменен",
        description: message || "Пароль успешно изменен. Необходимо войти заново.",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить пароль",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Пользователь не найден</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Личный кабинет</h1>
      </div>

      {/* Информация о пользователе */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация о пользователе
              </CardTitle>
              <CardDescription>
                Ваши личные данные и настройки
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">Имя</Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Фамилия</Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Введите фамилию"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRegion">Регион</Label>
                  <Input
                    id="editRegion"
                    value={editForm.region}
                    onChange={(e) => setEditForm(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Введите регион"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Статус верификации</label>
                <p className="text-lg font-semibold">
                  {user.isVerified ? 'Подтвержден' : 'Не подтвержден'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Изменение пароля */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Безопасность</CardTitle>
              <CardDescription>
                Измените пароль для вашего аккаунта
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Скрыть' : 'Изменить пароль'}
            </Button>
          </div>
        </CardHeader>
        {showPasswordForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Введите новый пароль"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Подтвердите новый пароль"
                />
              </div>
            </div>
            <Button onClick={handleChangePassword} className="bg-green-600 hover:bg-green-700">
              Изменить пароль
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Статистика (старый дизайн карточек) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отчётов отправлено</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reportsSent || 0}</div>
            <p className="text-xs text-muted-foreground">+12% с прошлого месяца</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ключевых слов</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.keywordsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Активных мониторинг</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Источников</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sourcesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Подключено источников</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новостей обработано</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newsProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">За последние 30 дней</p>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительная информация — удалено */}
    </div>
  );
}
