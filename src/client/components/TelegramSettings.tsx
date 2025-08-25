import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Bot, Send, TestTube, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../api';

interface TelegramSettingsData {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  summaryFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export const TelegramSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TelegramSettingsData>({
    botToken: '',
    chatId: '',
    isEnabled: false,
    summaryFrequency: 'DAILY'
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTelegramSettings();
      if (response.settings) {
        setSettings(response.settings);
        // Проверяем соединение при загрузке
        await testConnection();
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек Telegram:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await apiClient.updateTelegramSettings(settings);
      toast({
        title: "Настройки сохранены",
        description: "Настройки Telegram успешно обновлены",
      });
      // Проверяем соединение после сохранения
      await testConnection();
    } catch (error: any) {
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const response = await apiClient.testTelegramConnection();
      if (response.success) {
        setConnectionStatus('connected');
        toast({
          title: "Соединение установлено",
          description: "Telegram бот работает корректно",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Ошибка соединения",
          description: "Не удалось подключиться к Telegram боту",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus('disconnected');
      toast({
        title: "Ошибка тестирования",
        description: error.message || "Не удалось протестировать соединение",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      setTesting(true);
      await apiClient.sendTelegramReport({
        text: `🧪 <b>Тестовое сообщение</b>\n\nЭто тестовое сообщение от системы TaxNewsRadar.\n\nЕсли вы получили это сообщение, значит настройки Telegram работают корректно.\n\n📅 Отправлено: ${new Date().toLocaleString('ru-RU')}`
      });
      toast({
        title: "Тестовое сообщение отправлено",
        description: "Проверьте ваш Telegram чат",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить тестовое сообщение",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Подключено';
      case 'disconnected':
        return 'Не подключено';
      default:
        return 'Неизвестно';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Настройки Telegram
        </CardTitle>
        <CardDescription>
          Настройте интеграцию с Telegram ботом для получения уведомлений
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Статус соединения */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Статус соединения:</span>
            <Badge className={getConnectionStatusColor()}>
              {getConnectionStatusIcon()}
              {getConnectionStatusText()}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={testing}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Проверка...' : 'Проверить'}
          </Button>
        </div>

        {/* Основные настройки */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">Токен бота</Label>
            <Input
              id="botToken"
              type="password"
              value={settings.botToken}
              onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            <p className="text-xs text-muted-foreground">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId">ID чата</Label>
            <Input
              id="chatId"
              value={settings.chatId}
              onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
              placeholder="@username или -1001234567890"
            />
            <p className="text-xs text-muted-foreground">
              ID личного чата, группы или канала для отправки сообщений
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summaryFrequency">Частота отправки</Label>
            <Select
              value={settings.summaryFrequency}
              onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY') => 
                setSettings({ ...settings, summaryFrequency: value })
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
            <p className="text-xs text-muted-foreground">
              Как часто отправлять сводки новостей
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="isEnabled" className="text-sm font-medium">
                Включить уведомления
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Отправлять сводки новостей в Telegram
              </p>
            </div>
            <Switch
              id="isEnabled"
              checked={settings.isEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
            />
          </div>
        </div>

        <Separator />

        {/* Действия */}
        <div className="flex gap-2">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
          <Button
            variant="outline"
            onClick={sendTestMessage}
            disabled={testing || !settings.isEnabled || !settings.botToken || !settings.chatId}
          >
            <Send className="h-4 w-4 mr-2" />
            {testing ? 'Отправка...' : 'Тест'}
          </Button>
        </div>

        {/* Инструкции */}
        <Alert>
          <AlertTitle>Как настроить Telegram бота</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="text-sm">
              <strong>1. Создайте бота:</strong>
              <br />
              • Найдите @BotFather в Telegram
              <br />
              • Отправьте команду /newbot
              <br />
              • Следуйте инструкциям и сохраните токен
            </div>
            <div className="text-sm">
              <strong>2. Получите Chat ID:</strong>
              <br />
              • Для личного чата: напишите @userinfobot
              <br />
              • Для группы: добавьте бота в группу и отправьте сообщение
              <br />
              • Для канала: добавьте бота как администратора
            </div>
            <div className="text-sm">
              <strong>3. Настройте webhook:</strong>
              <br />
              • Запустите: node setup-telegram-webhook.js &lt;BOT_TOKEN&gt;
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
