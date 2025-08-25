import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useToastWithContainer } from '../hooks/use-toast';
import { api } from '../api';

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  isEnabled: boolean;
  summaryFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface TelegramSettings {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  summaryFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface ReportStats {
  totalReports: number;
  recentReports: any[];
  emailEnabled: boolean;
  telegramEnabled: boolean;
}

export const ReportSettings: React.FC = () => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: true,
    isEnabled: false,
    summaryFrequency: 'DAILY'
  });

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    isEnabled: false,
    summaryFrequency: 'DAILY'
  });

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testChatId, setTestChatId] = useState('');

  const { toast, toasts, dismiss } = useToastWithContainer();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Загружаем email настройки
      const emailResponse = await api.get('/reports/settings/email');
      if (emailResponse.data.settings) {
        setEmailSettings(emailResponse.data.settings);
      }

      // Загружаем telegram настройки
      const telegramResponse = await api.get('/reports/settings/telegram');
      if (telegramResponse.data.settings) {
        setTelegramSettings(telegramResponse.data.settings);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/reports/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setLoading(true);
      await api.post('/reports/settings/email', emailSettings);
      
      toast({
        title: 'Успешно',
        description: 'Email настройки сохранены'
      });
      
      loadStats();
    } catch (error: any) {
      console.error('Ошибка сохранения email настроек:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramSettings = async () => {
    try {
      setLoading(true);
      await api.post('/reports/settings/telegram', telegramSettings);
      
      toast({
        title: 'Успешно',
        description: 'Telegram настройки сохранены'
      });
      
      loadStats();
    } catch (error: any) {
      console.error('Ошибка сохранения telegram настроек:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    if (!testEmail) {
      toast({
        title: 'Ошибка',
        description: 'Введите email для тестирования',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      await api.post('/reports/test/email', { email: testEmail });
      
      toast({
        title: 'Успешно',
        description: 'Тестовое письмо отправлено'
      });
    } catch (error: any) {
      console.error('Ошибка тестирования email:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить тестовое письмо',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const testTelegram = async () => {
    if (!testChatId) {
      toast({
        title: 'Ошибка',
        description: 'Введите Chat ID для тестирования',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      await api.post('/reports/test/telegram', { chatId: testChatId });
      
      toast({
        title: 'Успешно',
        description: 'Тестовое сообщение отправлено в Telegram'
      });
    } catch (error: any) {
      console.error('Ошибка тестирования telegram:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить тестовое сообщение',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Настройки отчетов</h1>
          <p className="text-muted-foreground">
            Настройте отправку отчетов на email и в Telegram
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <Badge variant="secondary">
              Всего отчетов: {stats.totalReports}
            </Badge>
            <Badge variant={stats.emailEnabled ? "default" : "secondary"}>
              Email: {stats.emailEnabled ? "Включен" : "Выключен"}
            </Badge>
            <Badge variant={stats.telegramEnabled ? "default" : "secondary"}>
              Telegram: {stats.telegramEnabled ? "Включен" : "Выключен"}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email настройки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📧 Email настройки
            </CardTitle>
            <CardDescription>
              Настройте SMTP сервер для отправки отчетов на email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="email-enabled"
                checked={emailSettings.isEnabled}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, isEnabled: checked }))
                }
              />
              <Label htmlFor="email-enabled">Включить отправку на email</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-host">SMTP сервер</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.mail.ru"
                  value={emailSettings.smtpHost}
                  onChange={(e) => 
                    setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="smtp-port">Порт</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={emailSettings.smtpPort}
                  onChange={(e) => 
                    setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp-user">Email пользователя</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  placeholder="user@mail.ru"
                  value={emailSettings.smtpUser}
                  onChange={(e) => 
                    setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="smtp-pass">Пароль приложения</Label>
                <Input
                  id="smtp-pass"
                  type="password"
                  placeholder="Пароль приложения"
                  value={emailSettings.smtpPass}
                  onChange={(e) => 
                    setEmailSettings(prev => ({ ...prev, smtpPass: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-secure"
                checked={emailSettings.smtpSecure}
                onCheckedChange={(checked) => 
                  setEmailSettings(prev => ({ ...prev, smtpSecure: checked }))
                }
              />
              <Label htmlFor="smtp-secure">Использовать SSL/TLS</Label>
            </div>

            <div>
              <Label htmlFor="email-frequency">Частота отчетов</Label>
              <Select
                value={emailSettings.summaryFrequency}
                onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => 
                  setEmailSettings(prev => ({ ...prev, summaryFrequency: value }))
                }
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
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEmailSettings} className="flex-1">
                Сохранить настройки
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="test-email">Тестирование</Label>
              <div className="flex gap-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                                  <Button 
                    onClick={testEmailConnection} 
                    disabled={testing}
                    variant="outline"
                  >
                    {testing ? 'Отправка...' : 'Тест'}
                  </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram настройки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Telegram настройки
            </CardTitle>
            <CardDescription>
              Настройте бота для отправки отчетов в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="telegram-enabled"
                checked={telegramSettings.isEnabled}
                onCheckedChange={(checked) => 
                  setTelegramSettings(prev => ({ ...prev, isEnabled: checked }))
                }
              />
              <Label htmlFor="telegram-enabled">Включить отправку в Telegram</Label>
            </div>

            <div>
              <Label htmlFor="bot-token">Токен бота</Label>
              <Input
                id="bot-token"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramSettings.botToken}
                onChange={(e) => 
                  setTelegramSettings(prev => ({ ...prev, botToken: e.target.value }))
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                Получите токен у @BotFather в Telegram
              </p>
            </div>

            <div>
              <Label htmlFor="chat-id">Chat ID</Label>
              <Input
                id="chat-id"
                placeholder="123456789 или @username"
                value={telegramSettings.chatId}
                onChange={(e) => 
                  setTelegramSettings(prev => ({ ...prev, chatId: e.target.value }))
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                ID чата или канала для отправки отчетов
              </p>
            </div>

            <div>
              <Label htmlFor="telegram-frequency">Частота отчетов</Label>
              <Select
                value={telegramSettings.summaryFrequency}
                onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => 
                  setTelegramSettings(prev => ({ ...prev, summaryFrequency: value }))
                }
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
            </div>

            <div className="flex gap-2">
              <Button onClick={saveTelegramSettings} className="flex-1">
                Сохранить настройки
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="test-chat-id">Тестирование</Label>
              <div className="flex gap-2">
                <Input
                  id="test-chat-id"
                  placeholder="123456789"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                />
                <Button 
                  onClick={testTelegram} 
                  disabled={testing}
                  variant="outline"
                >
                  {testing ? 'Отправка...' : 'Тест'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Инструкции */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Инструкции по настройке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Email (SMTP):</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Mail.ru:</strong> smtp.mail.ru:465 (SSL), smtp.mail.ru:587 (TLS)</li>
              <li><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</li>
              <li><strong>Yandex:</strong> smtp.yandex.ru:465 (SSL)</li>
              <li>Используйте пароль приложения, а не основной пароль</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Telegram:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Создайте бота через @BotFather</li>
              <li>Получите токен бота</li>
              <li>Добавьте бота в нужный чат/канал</li>
              <li>Получите Chat ID через @userinfobot</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Toast уведомления */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toastItem) => (
            <div
              key={toastItem.id}
              className={`flex w-full max-w-sm items-start space-x-4 rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${
                toastItem.variant === 'destructive' 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : toastItem.variant === 'success'
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-medium leading-none">{toastItem.title}</h4>
                {toastItem.description && (
                  <p className="text-sm text-muted-foreground">{toastItem.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toastItem.id)}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  toastItem.variant === 'destructive' 
                    ? 'text-red-400 hover:text-red-600' 
                    : toastItem.variant === 'success'
                    ? 'text-green-400 hover:text-green-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Закрыть</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
