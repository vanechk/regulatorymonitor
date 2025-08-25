import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { useToastWithContainer } from '../hooks/use-toast';
import { api, apiClient } from '../api';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { CalendarIcon, Download, Mail, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ReportRequest {
  dateFrom: string;
  dateTo: string;
  email?: string;
  telegramChatId?: string;
  keywords?: string[];
  taxType?: string;
  subject?: string;
}

interface ReportResult {
  report: any;
  stats: {
    newsCount: number;
    emailSent: boolean;
    telegramSent: boolean;
  };
}

export const ReportGenerator: React.FC = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [taxType, setTaxType] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  
  // Настройки отправки
  const [sendEmail, setSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendTelegram, setSendTelegram] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  
  // Состояние
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [telegramSettings, setTelegramSettings] = useState<any>(null);

  const { toast, toasts, dismiss } = useToastWithContainer();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Загружаем email настройки
      const emailResponse = await api.get('/reports/settings/email');
      if (emailResponse.data.settings) {
        setEmailSettings(emailResponse.data.settings);
        if (emailResponse.data.settings.isEnabled) {
          setSendEmail(true);
          setEmailAddress(emailResponse.data.settings.smtpUser);
        }
      }

      // Загружаем telegram настройки
      try {
        const telegramResponse = await apiClient.getTelegramSettings();
        if (telegramResponse.settings) {
          setTelegramSettings(telegramResponse.settings);
          if (telegramResponse.settings.isEnabled) {
            setSendTelegram(true);
            setTelegramChatId(telegramResponse.settings.chatId);
          }
        }
      } catch (telegramError) {
        console.log('Telegram настройки не загружены:', telegramError);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      // Проверяем, есть ли уже такое слово (с учетом русских букв)
      const trimmedInput = keywordInput.trim();
      const isDuplicate = keywords.some(keyword => 
        keyword.toLowerCase() === trimmedInput.toLowerCase()
      );
      
      if (!isDuplicate) {
        setKeywords([...keywords, trimmedInput]);
        setKeywordInput('');
      } else {
        // Показываем уведомление о дубликате
        toast({
          title: 'Слово уже добавлено',
          description: `"${trimmedInput}" уже есть в списке ключевых слов`,
          variant: 'destructive'
        });
      }
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const generateReport = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: 'Ошибка',
        description: 'Выберите период для отчета',
        variant: 'destructive'
      });
      return;
    }

    if (dateFrom > dateTo) {
      toast({
        title: 'Ошибка',
        description: 'Дата начала не может быть позже даты окончания',
        variant: 'destructive'
      });
      return;
    }

    if (sendEmail && !emailAddress) {
      toast({
        title: 'Ошибка',
        description: 'Введите email для отправки',
        variant: 'destructive'
      });
      return;
    }

    if (sendTelegram && !telegramChatId) {
      toast({
        title: 'Ошибка',
        description: 'Введите Chat ID для отправки в Telegram',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGenerating(true);
      
      const reportRequest: ReportRequest = {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        keywords: keywords.length > 0 ? keywords : undefined,
        taxType: taxType || undefined,
        subject: subject || undefined
      };

      if (sendEmail) {
        reportRequest.email = emailAddress;
      }

      if (sendTelegram) {
        reportRequest.telegramChatId = telegramChatId;
      }

      const response = await api.post('/reports/generate', reportRequest);
      setReportResult(response.data);

      toast({
        title: 'Успешно',
        description: `Отчет сгенерирован! Найдено ${response.data.stats.newsCount} новостей`
      });

    } catch (error: any) {
      console.error('Ошибка генерации отчета:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось сгенерировать отчет',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportResult) return;
    
    // Здесь можно добавить логику для скачивания отчета в Excel или PDF
    toast({
      title: 'Информация',
      description: 'Функция скачивания будет добавлена в следующем обновлении'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Генератор отчетов</h1>
        <p className="text-muted-foreground">
          Создайте и отправьте отчет по налоговым новостям
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основные параметры */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Параметры отчета</CardTitle>
            <CardDescription>
              Настройте период и фильтры для отчета
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Период */}
            <div className="space-y-2">
              <Label>Период отчета</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Ключевые слова */}
            <div className="space-y-2">
              <Label>Ключевые слова</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите ключевое слово"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={addKeyword} variant="outline">
                  Добавить
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Тип налога */}
            <div className="space-y-2">
              <Label>Тип налога</Label>
              <Select value={taxType} onValueChange={setTaxType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип налога" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="НДС">НДС</SelectItem>
                  <SelectItem value="НДФЛ">НДФЛ</SelectItem>
                  <SelectItem value="Налог на прибыль">Налог на прибыль</SelectItem>
                  <SelectItem value="Страховые взносы">Страховые взносы</SelectItem>
                  <SelectItem value="Имущественные налоги">Имущественные налоги</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Тема */}
            <div className="space-y-2">
              <Label>Тема</Label>
              <Input
                placeholder="Введите тему для фильтрации"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Настройки отправки */}
        <Card>
          <CardHeader>
            <CardTitle>📤 Отправка отчета</CardTitle>
            <CardDescription>
              Выберите способы отправки отчета
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email отправка */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  disabled={!emailSettings?.isEnabled}
                />
                <Label htmlFor="send-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Отправить на email
                </Label>
              </div>
              {!emailSettings?.isEnabled && (
                <p className="text-sm text-muted-foreground">
                  Email настройки не настроены. Настройте их в разделе настроек отчетов.
                </p>
              )}
              {sendEmail && emailSettings?.isEnabled && (
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              )}
            </div>

            {/* Telegram отправка */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-telegram"
                  checked={sendTelegram}
                  onCheckedChange={setSendTelegram}
                  disabled={!telegramSettings?.isEnabled}
                />
                <Label htmlFor="send-telegram" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Отправить в Telegram
                </Label>
              </div>
              {!telegramSettings?.isEnabled && (
                <p className="text-sm text-muted-foreground">
                  Telegram настройки не настроены. Настройте их в разделе настроек отчетов.
                </p>
              )}
              {sendTelegram && telegramSettings?.isEnabled && (
                <Input
                  placeholder="Chat ID или @username"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
              )}
            </div>

            {/* Кнопка генерации */}
            <Button 
              onClick={generateReport} 
              disabled={generating || (!sendEmail && !sendTelegram)}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Генерация отчета...
                </>
              ) : (
                'Сгенерировать отчет'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Результат */}
      {reportResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📋 Результат отчета
              <div className="flex gap-2">
                <Button onClick={downloadReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportResult.stats.newsCount}</div>
                <div className="text-sm text-blue-600">Найдено новостей</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {reportResult.stats.emailSent ? '✓' : '✗'}
                </div>
                <div className="text-sm text-green-600">Email отправлен</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {reportResult.stats.telegramSent ? '✓' : '✗'}
                </div>
                <div className="text-sm text-purple-600">Telegram отправлен</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Детали отчета:</h4>
              <p><strong>Название:</strong> {reportResult.report.name}</p>
              <p><strong>Период:</strong> {format(new Date(reportResult.report.dateFrom), 'PPP', { locale: ru })} - {format(new Date(reportResult.report.dateTo), 'PPP', { locale: ru })}</p>
              <p><strong>Создан:</strong> {format(new Date(reportResult.report.createdAt), 'PPP', { locale: ru })}</p>
              {reportResult.report.keywordsUsed && (
                <p><strong>Ключевые слова:</strong> {reportResult.report.keywordsUsed}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
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
                  ? 'text-green-50 border-green-200 text-green-900'
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
