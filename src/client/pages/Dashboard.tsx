import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Keyword, type NewsItem } from '../api';
import { useToast } from '../utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { FilterCalendar } from '../../components/ui/filter-calendar';
import { Badge } from '../../components/ui/badge';
import { Filter, ChevronRight, FileText, Mail, CheckSquare, Square, Send } from 'lucide-react';
import { EmailSender } from '../components/EmailSender';
import { Alert } from '../../components/ui/alert';
import { NewsItem as NewsItemType } from '../../types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

// Категоризация новостей с типами
function categorizeNews(newsItems: NewsItemType[]): Record<string, NewsItemType[]> {
  const categories: Record<string, NewsItemType[]> = {
    npa: [],
    minfin: [],
    fns: [],
    media: [],
    telegram: [],
    court: [],
    other: []
  };
  newsItems.forEach((item: NewsItemType) => {
    const sourceType = (item as any).source?.type || '';
    const sourceName = ((item as any).source?.name || item.sourceName || '').toLowerCase();
    const doc = (item.documentRef || '').toLowerCase();
    const subj = (item.subject || '').toLowerCase();
    if (/постановление|закон|приказ|указание|федеральный закон|нпа/.test(doc) || /постановление|закон|приказ|указание|федеральный закон|нпа/.test(subj)) {
      categories.npa.push(item);
    } else if (sourceName.includes('минфин') || doc.includes('минфин') || subj.includes('минфин')) {
      categories.minfin.push(item);
    } else if (sourceName.includes('фнс') || doc.includes('фнс') || subj.includes('фнс')) {
      categories.fns.push(item);
    } else if (sourceType === 'telegram') {
      categories.telegram.push(item);
    } else if (/суд|арбитраж|решение суда/.test(sourceName) || /суд|арбитраж|решение суда/.test(doc) || /суд|арбитраж|решение суда/.test(subj)) {
      categories.court.push(item);
    } else if (sourceType === 'website' && (/ведомости|рбк|тасс|интерфакс|коммерсант|форбс|газета/.test(sourceName))) {
      categories.media.push(item);
    } else {
      categories.other.push(item);
    }
  });
  return categories;
}

function extractLawStatus(text: string): { status: string, color: string } | null {
  const lower = text.toLowerCase();
  if (!lower.includes('законопроект')) return null;
  if (lower.includes('принят')) return { status: 'Принят', color: 'green' };
  if (lower.includes('отклонён') || lower.includes('отклонен')) return { status: 'Отклонён', color: 'red' };
  if (lower.includes('на рассмотрении')) return { status: 'На рассмотрении', color: 'yellow' };
  if (lower.includes('внесён') || lower.includes('внесен')) return { status: 'Внесён', color: 'yellow' };
  return null;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterKeywords, setFilterKeywords] = useState<string>("");
  const [sourceType, setSourceType] = useState<string | undefined>(undefined);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [showEmailSender, setShowEmailSender] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [weekChecked, setWeekChecked] = useState(false);
  const [monthChecked, setMonthChecked] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('week');
  const [showTelegramPreview, setShowTelegramPreview] = useState(false);
  const [telegramReportText, setTelegramReportText] = useState('');

  // Fetch news
  const { data: newsItems = [], isLoading: isLoadingNews } = useQuery<NewsItemType[]>({
    queryKey: ['news', { dateFrom, dateTo, filterKeywords, sourceType }],
    queryFn: async () => {
      try {
        setApiError(null);
        console.log('Запрос новостей с параметрами:', { dateFrom, dateTo, filterKeywords, sourceType });
        const data = await apiClient.getNews({
          dateFrom: dateFrom?.toISOString(),
          dateTo: dateTo?.toISOString(),
          keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()).filter(k => k !== '') : undefined,
          sourceType,
        });
        console.log('Получены данные от API:', data);
        return data;
      } catch (err: any) {
        console.error('ОШИБКА при загрузке или парсинге новостей:', err);
        setApiError('Ошибка загрузки новостей. Проверьте консоль разработчика (F12) для деталей.');
        throw err;
      }
    },
  });

  // Fetch keywords for suggestions
  const { data: keywords = [] } = useQuery<Keyword[]>({
    queryKey: ['keywords'],
    queryFn: apiClient.listKeywords,
  });

  // Task status for news processing
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  // Polling for task status
  const { data: processingStatus } = useQuery<{ status: string }>({
    queryKey: ['processingStatus', processingTaskId],
    queryFn: () => apiClient.getNewsProcessingStatus({ taskId: processingTaskId! }),
    enabled: !!processingTaskId,
    refetchInterval: processingTaskId ? 5000 : false,
  });

  // Обработка завершения задачи
  useEffect(() => {
    if (processingStatus && (processingStatus.status === 'completed' || processingStatus.status === 'failed')) {
      setProcessingTaskId(null);
      queryClient.invalidateQueries({ queryKey: ['news'] });
      
      if (processingStatus.status === 'completed') {
        toast({
          title: "Загрузка завершена",
          description: "Новости успешно загружены и обработаны",
        });
      } else {
        toast({
          title: "Ошибка загрузки",
          description: "Произошла ошибка при загрузке новостей",
          variant: "destructive",
        });
      }
    }
  }, [processingStatus, queryClient, toast]);

  // Fetch and process news mutation
  const fetchNewsMutation = useMutation<
    { taskId: string | null; message: string; status: string },
    Error,
    { sourceType?: string; keywords?: string[] }
  >({
    mutationFn: apiClient.fetchAndProcessNews,
    onSuccess: (data) => {
      if (data.taskId) {
        setProcessingTaskId(String(data.taskId));
      }
    },
  });

  // Export current news mutation
  const exportCurrentMutation = useMutation<
    { reportId: string; fileUrl: string; itemCount: number },
    Error,
    { newsIds: string[] }
  >({
    mutationFn: ({ newsIds }) => apiClient.exportCurrentNewsToExcel({
      newsIds,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()) : undefined,
      sourceType,
    }),
    onSuccess: (data) => {
      // Запускаем скачивание файла
      window.location.href = data.fileUrl;
      toast({
        title: "Экспорт завершен",
        description: `Экспортировано ${data.itemCount} новостей. Скачивание началось автоматически.`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка экспорта",
        description: error.message || "Не удалось экспортировать новости",
        variant: "destructive",
      });
    },
  });

  // Remove keyword mutation
  const removeKeywordMutation = useMutation<
    void,
    Error,
    { id: string }
  >({
    mutationFn: apiClient.removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation<
    void,
    Error,
    { id: string }
  >({
    mutationFn: apiClient.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Источник удален",
      });
    },
  });

  // Effect to refetch news when filters are cleared
  useEffect(() => {
    if (!dateFrom && !dateTo && !filterKeywords && !sourceType) {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    }
  }, [dateFrom, dateTo, filterKeywords, sourceType, queryClient]);

  const handleRemoveKeyword = (id: string) => {
    removeKeywordMutation.mutate({ id });
  };

  const handleDeleteSource = (id: string) => {
    deleteSourceMutation.mutate({ id });
  };

  const handleFetchNews = () => {
    if (fetchNewsMutation.isPending) return;
    fetchNewsMutation.mutate({
      sourceType,
      keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()) : undefined,
    }, {
      onError: () => setApiError('Ошибка загрузки новостей. Проверьте соединение с сервером.'),
    });
  };

  const handleExport = () => {
    if (exportCurrentMutation.isPending) return;
    
    // Если есть выбранные новости, экспортируем их, иначе используем текущие фильтры
    const newsIdsToExport = selectedNewsIds.length > 0 ? selectedNewsIds : [];
    
    if (newsIdsToExport.length === 0 && newsItems.length === 0) {
      toast({
        title: "Нет новостей для экспорта",
        description: "Пожалуйста, выберите новости или примените фильтры",
        variant: "destructive",
      });
      return;
    }
    
    exportCurrentMutation.mutate({ newsIds: newsIdsToExport }, {
      onError: () => setApiError('Ошибка экспорта. Проверьте соединение с сервером.'),
    });
  };

  const handleDateRangeSelect = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleSelectNews = (newsId: string) => {
    setSelectedNewsIds(prev => 
      prev.includes(newsId) 
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId]
    );
  };

  const handleSelectAllNews = () => {
    if (selectedNewsIds.length === newsItems.length) {
      setSelectedNewsIds([]);
    } else {
      setSelectedNewsIds(newsItems.map(item => item.id));
    }
  };

  const handleSendEmail = () => {
    if (selectedNewsIds.length === 0) {
      toast({
        title: "Нет выбранных новостей",
        description: "Пожалуйста, выберите новости для отправки",
        variant: "destructive",
      });
      return;
    }
    setShowEmailSender(true);
  };

  const handleEmailSuccess = () => {
    toast({
      title: "Email отправлен",
      description: `Новости успешно отправлены на email`,
    });
    setSelectedNewsIds([]);
  };

  const handleSendTelegram = () => {
    if (selectedNewsIds.length === 0) {
      toast({
        title: "Нет выбранных новостей",
        description: "Пожалуйста, выберите новости для отправки",
        variant: "destructive",
      });
      return;
    }
    
    // Получаем выбранные новости
    const selectedNews = newsItems.filter(item => selectedNewsIds.includes(item.id));
    
    // Генерируем текст для Telegram
    let telegramText = `📰 Выбранные новости (${selectedNewsIds.length})\n\n`;
    
    selectedNews.forEach((item, index) => {
      telegramText += `${index + 1}. **${item.title}**\n`;
      telegramText += `📝 ${item.summary || 'Описание недоступно'}\n`;
      telegramText += `🏢 Источник: ${item.sourceName}\n`;
      telegramText += `📅 ${new Date(item.publishedAt).toLocaleDateString('ru-RU')}\n`;
      if (item.sourceUrl) {
        telegramText += `🔗 [Читать полностью](${item.sourceUrl})\n`;
      }
      telegramText += '\n';
    });
    
    telegramText += `\n📤 Отправлено из TaxNewsRadar\n`;
    telegramText += `🕐 ${new Date().toLocaleString('ru-RU')}`;
    
    setTelegramReportText(telegramText);
    setShowTelegramPreview(true);
  };

  // Генерация текста отчёта для Telegram
  function generateTelegramReport(newsItems: NewsItemType[], dateFrom?: Date, dateTo?: Date): string {
    if (!dateFrom || !dateTo) return '';
    const formatDate = (date: Date) => date.toLocaleDateString('ru-RU');
    const period = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
    let report = `Мониторинг законодательства - ${period}\n\n`;
    newsItems.forEach(item => {
      // Экранируем спецсимволы для MarkdownV2 Telegram
      const escape = (text: string) => text.replace(/[\[\]()_~`>#+\-=|{}.!]/g, r => '\\' + r);
      const title = escape(item.title);
      const sourceName = escape(item.sourceName);
      const url = item.sourceUrl;
      report += `- [${title}](${url}) (Источник: [${sourceName}](${url}))\n`;
    });
    return report;
  }

  // Мутация для отправки отчёта в Telegram
  const sendTelegramMutation = useMutation<
    { ok: boolean; message: string },
    Error,
    { text: string }
  >({
    mutationFn: ({ text }) => apiClient.sendTelegramReport({ text }),
    onSuccess: () => {
      toast({
        title: 'Отправлено в Telegram',
        description: 'Отчёт успешно отправлен в Telegram-канал',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка отправки',
        description: 'Не удалось отправить отчёт в Telegram',
        variant: 'destructive',
      });
    },
  });

  // Новый обработчик кнопки Telegram
  const handleSendTelegramDay = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: 'Не выбран период',
        description: 'Пожалуйста, выберите период для отчёта',
        variant: 'destructive',
      });
      return;
    }
    const reportText = generateTelegramReport(newsItems, dateFrom, dateTo);
    if (!reportText.trim()) {
      toast({
        title: 'Нет новостей',
        description: 'Нет новостей для отправки за выбранный период',
        variant: 'destructive',
      });
      return;
    }
    setTelegramReportText(reportText);
    setShowTelegramPreview(true);
  };

  const handleSendTelegramWeek = () => {
    toast({
      title: 'Отправка в Telegram',
      description: 'Будет отправлен перечень новостей за неделю в Telegram-канал',
      variant: 'default',
    });
  };

  const categorized = categorizeNews(newsItems);

  function handleWeekCheckbox() {
    if (!weekChecked) {
      const now = new Date();
      // Определяем день недели (0 - воскресенье, 1 - понедельник, ...)
      const dayOfWeek = now.getDay();
      // Смещение до последнего воскресенья (конец прошлой недели)
      const daysSinceLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
      // Конец прошлой недели (воскресенье)
      const to = new Date(now);
      to.setDate(now.getDate() - daysSinceLastSunday);
      to.setHours(23, 59, 59, 999);
      // Начало прошлой недели (понедельник)
      const from = new Date(to);
      from.setDate(to.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      setDateFrom(from);
      setDateTo(to);
      setWeekChecked(true);
      setMonthChecked(false);
    } else {
      setDateFrom(undefined);
      setDateTo(undefined);
      setWeekChecked(false);
    }
  }

  function handleMonthCheckbox() {
    if (!monthChecked) {
      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      setDateFrom(monthAgo);
      setDateTo(now);
      setMonthChecked(true);
      setWeekChecked(false);
    } else {
      setDateFrom(undefined);
      setDateTo(undefined);
      setMonthChecked(false);
    }
  }

  const handleDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
    if (range === 'today') {
      const today = new Date();
      const from = new Date(today);
      from.setHours(0, 0, 0, 0);
      const to = new Date(today);
      to.setHours(23, 59, 59, 999);
      setDateFrom(from);
      setDateTo(to);
    } else if (range === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const to = new Date(yesterday);
      to.setHours(23, 59, 59, 999);
      setDateFrom(yesterday);
      setDateTo(to);
    } else if (range === 'week') {
      handleWeekCheckbox();
    } else if (range === 'month') {
      handleMonthCheckbox();
    }
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-muted-foreground">
            Мониторинг налоговых новостей и документов
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleFetchNews}
            disabled={fetchNewsMutation.isPending || !!processingTaskId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {fetchNewsMutation.isPending ? "Загрузка..." : "Загрузить новости"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportCurrentMutation.isPending}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {exportCurrentMutation.isPending ? "Экспорт..." : "Экспорт в Excel"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center heading-primary">
            <Filter className="mr-2 h-4 w-4" />
            Параметры поиска
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dateRange" className="block mb-2">Период публикации</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={dateRange === 'today' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateRange('today')}
                      className={dateRange === 'today' ? "" : ""}
                    >
                      Сегодня
                    </Button>
                    <Button
                      variant={dateRange === 'yesterday' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateRange('yesterday')}
                      className={dateRange === 'yesterday' ? "" : ""}
                    >
                      Вчера
                    </Button>
                    <Button
                      variant={dateRange === 'week' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateRange('week')}
                      className={dateRange === 'week' ? "" : ""}
                    >
                      Неделя
                    </Button>
                    <Button
                      variant={dateRange === 'month' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateRange('month')}
                      className={dateRange === 'month' ? "" : ""}
                    >
                      Месяц
                    </Button>
                  </div>
                  <div className="mt-4">
                    <FilterCalendar
                      selectedDateFrom={dateFrom}
                      selectedDateTo={dateTo}
                      onDateFromSelect={(date) => { setDateFrom(date); setDateRange('custom'); }}
                      onDateToSelect={(date) => { setDateTo(date); setDateRange('custom'); }}
                      onRangeSelect={(from, to) => { setDateFrom(from); setDateTo(to); setDateRange('custom'); }}
                      className="w-full"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sourceType" className="block mb-2">Источник информации</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant={sourceType === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType(undefined)}
                      className={sourceType === undefined ? "" : ""}
                    >
                      Все источники
                    </Button>
                    <Button
                      variant={sourceType === "website" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType("website")}
                      className={sourceType === "website" ? "" : ""}
                    >
                      Официальные сайты
                    </Button>
                    <Button
                      variant={sourceType === "telegram" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSourceType("telegram")}
                      className={sourceType === "telegram" ? "" : ""}
                    >
                      Telegram-каналы
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">
                      Выберите тип источника для фильтрации новостей
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="keywords" className="block mb-2">Фильтр по ключевым словам</Label>
                  <Input
                    id="keywords"
                    value={filterKeywords}
                    onChange={(e) => setFilterKeywords(e.target.value)}
                    placeholder="Введите ключевые слова через запятую"
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {apiError && (
        <Alert variant="destructive" className="mb-4">
          {apiError}
        </Alert>
      )}

      {/* News Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Результаты ({newsItems.length})
          </h2>
          {newsItems.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllNews}
                className="flex items-center gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {selectedNewsIds.length === newsItems.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedNewsIds.length === newsItems.length ? 'Снять выделение' : 'Выбрать все'}
              </Button>
              {selectedNewsIds.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSendEmail}
                    className="flex items-center gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Mail className="h-4 w-4" />
                    Отправить на email ({selectedNewsIds.length})
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSendTelegram}
                    className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Send className="h-4 w-4" />
                    Отправить в Telegram ({selectedNewsIds.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoadingNews ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : newsItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Нет новостей</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Попробуйте изменить фильтры или нажмите "Загрузить новости"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries({
              'Нормативно-правовые акты': categorized.npa,
              'Письма Минфина': categorized.minfin,
              'Письма ФНС': categorized.fns,
              'СМИ': categorized.media,
              'Telegram': categorized.telegram,
              'Суды': categorized.court,
              'Другое': categorized.other
            } as Record<string, NewsItemType[]>).map(([cat, items]) =>
              items.length > 0 && (
                <div key={cat}>
                  <h3 className="text-2xl font-bold mb-4">{cat}</h3>
                  <div className="space-y-4">
                    {items.map((item: NewsItemType) => (
                      <Card 
                        key={item.id} 
                        className={`transition-colors ${
                          selectedNewsIds.includes(item.id) ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => handleSelectNews(item.id)}
                                className="mt-1 flex-shrink-0"
                              >
                                {selectedNewsIds.includes(item.id) ? (
                                  <CheckSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  <a
                                    href={item.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {item.title}
                                  </a>
                                </CardTitle>
                                <CardDescription>
                                  Источник: {item.sourceName}
                                  {item.documentRef && ` | ${item.documentRef}`}
                                  {item.taxType && ` | ${item.taxType}`}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              {item.summary}
                            </p>
                            {item.content && (
                              <div className="text-sm text-gray-700 mt-2">
                                {item.content}
                              </div>
                            )}
                            {(item.taxType || item.position || item.documentRef) && (
                              <div className="grid gap-2 text-sm text-gray-500">
                                {item.taxType && (
                                  <div>
                                    <span className="font-medium">Тип налога:</span> {item.taxType}
                                  </div>
                                )}
                                {item.position && (
                                  <div>
                                    <span className="font-medium">Позиция:</span> {item.position}
                                  </div>
                                )}
                                {item.documentRef && (
                                  <div>
                                    <span className="font-medium">Документ:</span> {item.documentRef}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.title.toLowerCase().includes('законопроект') && (
                              <div>
                                <span className="font-medium">Статус законопроекта:</span> {extractLawStatus(item.title + ' ' + (item.summary || ''))?.status}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Email Sender Modal */}
      {showEmailSender && (
        <EmailSender
          selectedNewsIds={selectedNewsIds}
          onClose={() => setShowEmailSender(false)}
          onSuccess={handleEmailSuccess}
        />
      )}

      {/* Telegram Preview Dialog */}
      <Dialog open={showTelegramPreview} onOpenChange={setShowTelegramPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Предпросмотр отчёта для Telegram</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            {telegramReportText}
          </pre>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTelegramPreview(false)}
              className="border-gray-600 text-gray-600 hover:bg-gray-50"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                sendTelegramMutation.mutate({ text: telegramReportText });
                setShowTelegramPreview(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Отправить в Telegram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 