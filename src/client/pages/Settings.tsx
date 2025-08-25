import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient, type Source, type Keyword } from '../api';
import { useToast } from '../utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import { ColorPicker } from '../../components/ui/color-picker';
import { Mail, Plus, Trash2, ChevronRight, Palette, User, Shield, Eye, EyeOff, Bell, Globe, Hash, Key } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TelegramSettings } from '../components/TelegramSettings';

export default function Settings() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { themeColor, setThemeColor, resetToDefaultTheme } = useTheme();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newKeyword, setNewKeyword] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState("website");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState("DAILY");
  const [websiteGroupOpen, setWebsiteGroupOpen] = useState(true);
  const [telegramGroupOpen, setTelegramGroupOpen] = useState(true);

  // Состояние для вкладки конфиденциальности
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [region, setRegion] = useState(user?.region || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    delete: false
  });

  // Fetch sources
  const { data: sources = [], isLoading: isLoadingSources } = useQuery<Source[]>({
    queryKey: ['sources'],
    queryFn: apiClient.listSources,
  });

  // Fetch keywords
  const { data: keywords = [], isLoading: isLoadingKeywords } = useQuery<Keyword[]>({
    queryKey: ['keywords'],
    queryFn: apiClient.listKeywords,
  });

  // Fetch email settings
  const { data: emailSettings } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: apiClient.getEmailSettings,
  });

  // Инициализируем email настройки при загрузке
  useEffect(() => {
    if (emailSettings) {
      setEmailAddress(emailSettings.email || '');
      setEmailEnabled(emailSettings.isEnabled || false);
      setEmailFrequency(emailSettings.summaryFrequency || 'DAILY');
    }
  }, [emailSettings]);

  // Mutations
  const addSourceMutation = useMutation({
    mutationFn: apiClient.addSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setNewSourceName("");
      setNewSourceUrl("");
      setNewSourceType("website");
      toast({
        title: "Источник добавлен",
        description: "Новый источник успешно добавлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить источник",
        variant: "destructive",
      });
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: apiClient.addKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      setNewKeyword("");
      toast({
        title: "Ключевое слово добавлено",
        description: "Новое ключевое слово успешно добавлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить ключевое слово",
        variant: "destructive",
      });
    },
  });

  const removeKeywordMutation = useMutation({
    mutationFn: apiClient.removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast({
        title: "Ключевое слово удалено",
        description: "Ключевое слово успешно удалено",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить ключевое слово",
        variant: "destructive",
      });
    },
  });

  const toggleSourceMutation = useMutation({
    mutationFn: apiClient.toggleSource,
    onSuccess: (updatedSource) => {
      // Обновляем локальное состояние источника
      queryClient.setQueryData(['sources'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((source: any) => 
          source.id === updatedSource.id 
            ? { ...source, isEnabled: updatedSource.isEnabled }
            : source
        );
      });
      toast({
        title: "Источник обновлен",
        description: `Источник "${updatedSource.name}" ${updatedSource.isEnabled ? 'включен' : 'отключен'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить источник",
        variant: "destructive",
      });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: apiClient.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Источник удален",
        description: "Источник успешно удален",
      });
    },
  });

  const updateEmailSettingsMutation = useMutation({
    mutationFn: apiClient.updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
    },
  });

  // Обработчики для вкладки конфиденциальности
  const handleUpdateProfile = async () => {
    try {
      // Проверяем, что есть изменения
      if (!firstName.trim() && !lastName.trim() && !region.trim()) {
        toast({
          title: "Предупреждение",
          description: "Введите хотя бы одно поле для обновления",
          variant: "destructive",
        });
        return;
      }

      await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        region: region.trim() || undefined
      });
      
      toast({
        title: "Профиль обновлен",
        description: "Данные профиля успешно обновлены",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    try {
      const message = await changePassword(
        currentPassword, 
        newPassword,
        () => navigate('/auth') // Callback для перенаправления
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast({
        title: "Пароль изменен",
        description: message || "Пароль успешно изменен. Необходимо войти заново.",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить пароль",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deletePassword);
      toast({
        title: "Аккаунт удален",
        description: "Ваш аккаунт успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить аккаунт",
        variant: "destructive",
      });
    }
  };

  const handleUpdateThemeColor = async () => {
    try {
      // Явно обновляем профиль пользователя с новым цветом темы
      await updateProfile({
        themeColor
      });
      
      // Принудительно обновляем все элементы с цветами темы
      setTimeout(() => {
        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
        
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.transform = 'translateZ(0)';
            setTimeout(() => {
              element.style.transform = '';
            }, 10);
          }
        });
        
        // Отправляем событие изменения темы
        const event = new Event('themeChange');
        window.dispatchEvent(event);
        
        console.log('Settings: Принудительное обновление стилей завершено');
      }, 200);
      
      toast({
        title: "Цвет темы обновлен",
        description: "Цвет темы успешно применен и сохранен в профиле",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить цвет темы",
        variant: "destructive",
      });
    }
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeywordMutation.mutate({ text: newKeyword.trim() });
    }
  };

  const handleAddSource = () => {
    if (newSourceName.trim() && newSourceUrl.trim()) {
      addSourceMutation.mutate({
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
        type: newSourceType,
      });
    }
  };

  const handleUpdateEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateEmailSettingsMutation.mutateAsync({
        email: emailAddress,
        isEnabled: emailEnabled,
        summaryFrequency: emailFrequency,
      });
      
      toast({
        title: "Настройки сохранены",
        description: "Email настройки успешно обновлены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };

  const handleSendTestEmail = async () => {
    try {
      toast({
        title: "Отправка тестового письма...",
        description: "Пожалуйста, подождите",
      });

      const result = await apiClient.sendNewsEmailSummary({ email: emailAddress });
      
      console.log('Тестовое письмо отправлено:', result);
      
      toast({
        title: "Тестовое письмо отправлено!",
        description: "Проверьте консоль браузера и терминал сервера для деталей",
      });
    } catch (error) {
      console.error('Ошибка отправки тестового письма:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить тестовое письмо. Проверьте консоль для деталей.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSource = (id: string) => {
    deleteSourceMutation.mutate({ id });
  };



  const websiteSources = sources.filter((s) => s.type === "website");
  const telegramSources = sources.filter((s) => s.type === "telegram");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управление Вашим аккаунтом
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Источники</TabsTrigger>
          <TabsTrigger value="keywords">Ключевые слова</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления и отчеты</TabsTrigger>
          <TabsTrigger value="privacy">Конфиденциальность</TabsTrigger>
          <TabsTrigger value="personalization">Персонализация</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Добавить новый источник
              </CardTitle>
              <CardDescription>
                Добавьте новый источник для мониторинга
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceName">Название источника</Label>
                  <Input
                    id="sourceName"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Название источника"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL источника</Label>
                  <Input
                    id="sourceUrl"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceType">Тип источника</Label>
                  <Select value={newSourceType} onValueChange={setNewSourceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Веб-сайт</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleAddSource} 
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить источник
              </Button>
            </CardContent>
          </Card>

          <Collapsible open={websiteGroupOpen} onOpenChange={setWebsiteGroupOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Веб-сайты</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", websiteGroupOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardContent className="pt-4">
                  {isLoadingSources ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {websiteSources.map((source) => (
                        <div key={source.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`source-website-${source.id}`}
                              checked={source.isEnabled}
                              onCheckedChange={(checked) => {
                                toggleSourceMutation.mutate({
                                  id: source.id,
                                  isEnabled: checked,
                                });
                              }}
                            />
                            <Label htmlFor={`source-website-${source.id}`} className="cursor-pointer">
                              {source.name}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {source.url}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteSource(source.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={telegramGroupOpen} onOpenChange={setTelegramGroupOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Telegram каналы</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", telegramGroupOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardContent className="pt-4">
                  {isLoadingSources ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {telegramSources.map((source) => (
                        <div key={source.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`source-telegram-${source.id}`}
                              checked={source.isEnabled}
                              onCheckedChange={(checked) => {
                                toggleSourceMutation.mutate({
                                  id: source.id,
                                  isEnabled: checked,
                                });
                              }}
                            />
                            <Label htmlFor={`source-telegram-${source.id}`} className="cursor-pointer">
                              {source.name}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {source.url}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteSource(source.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Настройки Telegram канала перенесены в блок уведомлений */}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Ключевые слова
              </CardTitle>
              <CardDescription>
                Добавьте ключевые слова для фильтрации новостей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Введите ключевое слово"
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {isLoadingKeywords ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))
            ) : (
              keywords.map((keyword) => (
                <div key={keyword.id} className="flex items-center justify-between border rounded-lg p-3">
                  <span>{keyword.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeKeywordMutation.mutate({ id: keyword.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления
              </CardTitle>
              <CardDescription>
                Настройте уведомления о новых новостях и отчетах
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Email адрес */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email-адрес</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="example@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Укажите email для получения уведомлений
                    </p>
                  </div>
                </div>

                {/* Telegram настройки */}
                <TelegramSettings />

                {/* Email уведомления */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="emailNotifications" className="text-sm font-medium">
                        Email уведомления
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Получать сводки новостей на email
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch 
                        id="emailNotifications"
                        checked={emailEnabled}
                        onCheckedChange={setEmailEnabled}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>
                  </div>
                  
                  {emailEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="emailFrequency">Частота отправки</Label>
                      <Select
                        value={emailFrequency}
                        onValueChange={setEmailFrequency}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Ежедневно</SelectItem>
                          <SelectItem value="WEEKLY">Еженедельно</SelectItem>
                          <SelectItem value="MONTHLY">Ежемесячно</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Выберите, как часто получать сводки новостей
                      </p>
                    </div>
                  )}
                </div>

                {/* Настройки отчетов убраны - не несут практической пользы */}
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // Сохраняем email настройки
                      apiClient.updateEmailSettings({
                        email: emailAddress,
                        isEnabled: emailEnabled,
                        summaryFrequency: emailFrequency,
                      });
                      
                      toast({
                        title: "Настройки сохранены",
                        description: "Email настройки обновлены",
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Сохранить email настройки
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Конфиденциальность
              </CardTitle>
              <CardDescription>
                Управление личными данными и настройками безопасности
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите фамилию"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Регион</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Введите регион"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdateProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Сохранить изменения
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Изменение пароля
              </CardTitle>
              <CardDescription>
                Измените пароль для вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Введите текущий пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Введите новый пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Подтвердите новый пароль</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Подтвердите новый пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleChangePassword}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Изменить пароль
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Удаление аккаунта
              </CardTitle>
              <CardDescription>
                Удалите ваш аккаунт и все связанные данные
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Внимание!</AlertTitle>
                <AlertDescription>
                  Это действие необратимо. Все ваши данные будут удалены без возможности восстановления.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Input
                    id="deletePassword"
                    type={showPasswords.delete ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Введите пароль для подтверждения"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, delete: !prev.delete }))}
                  >
                    {showPasswords.delete ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Удалить аккаунт
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Персонализация
              </CardTitle>
              <CardDescription>
                Настройте внешний вид и цветовую схему приложения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-lg font-medium">Цвет темы</Label>
                <p className="text-sm text-muted-foreground">
                  Выберите основной цвет для интерфейса приложения
                </p>
                <ColorPicker
                  value={themeColor}
                  onChange={setThemeColor}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpdateThemeColor}
                  style={{
                    backgroundColor: themeColor.startsWith('#') ? themeColor : `hsl(${themeColor})`,
                    borderColor: themeColor.startsWith('#') ? themeColor : `hsl(${themeColor})`
                  }}
                  className="text-white hover:opacity-90 transition-opacity flex-1"
                >
                  Сохранить цвет темы
                </Button>
                
                <Button 
                  onClick={resetToDefaultTheme}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Сбросить к базовой теме
                </Button>
              </div>
              
              {/* Быстрые тесты цветов */}
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Быстрые тесты цветов</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => {
                      setThemeColor('0 100% 50%');
                      // Принудительно обновляем стили
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    Красный
                  </Button>
                  <Button 
                    onClick={() => {
                      setThemeColor('120 100% 50%');
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                  >
                    Зеленый
                  </Button>
                  <Button 
                    onClick={() => {
                      setThemeColor('240 100% 50%');
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    Синий
                  </Button>
                  <Button 
                    onClick={() => {
                      setThemeColor('300 100% 50%');
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    size="sm"
                  >
                    Розовый
                  </Button>
                  <Button 
                    onClick={() => {
                      setThemeColor('45 100% 50%');
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    size="sm"
                  >
                    Желтый
                  </Button>
                  <Button 
                    onClick={() => {
                      setThemeColor('280 100% 50%');
                      setTimeout(() => {
                        const elements = document.querySelectorAll('[class*="bg-primary"], [class*="text-primary"], [class*="border-primary"], [class*="bg-accent"], [class*="text-accent"], [class*="border-accent"]');
                        elements.forEach(element => {
                          if (element instanceof HTMLElement) {
                            element.style.transform = 'translateZ(0)';
                            setTimeout(() => element.style.transform = '', 10);
                          }
                        });
                        window.dispatchEvent(new Event('themeChange'));
                      }, 100);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    size="sm"
                  >
                    Фиолетовый
                  </Button>
                </div>
              </div>
              
              {/* Предварительный просмотр темы */}
              {/* <ThemePreview themeColor={themeColor} /> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 