import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Keyword, type NewsItem } from '../../client/api';
import { useToast } from '../../client/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { FilterCalendar } from '../../components/ui/filter-calendar';
import { Badge } from '../../components/ui/badge';
import { Filter, ChevronRight, FileText, Mail, CheckSquare, Square } from 'lucide-react';
import { EmailSender } from '../components/EmailSender';
import { Alert } from '../../components/ui/alert';
import vtbLogo from '../../../assets/vtb-logo.svg';
import { ReactComponent as VtbLogo } from '../../../assets/vtb-logo.svg';

declare module '*.svg' {
  const value: string;
  export default value;
}
declare module '*.png' {
  const value: string;
  export default value;
}
declare module '*.jpg' {
  const value: string;
  export default value;
}
declare module '*.jpeg' {
  const value: string;
  export default value;
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

  // Fetch news
  const { data: newsItems = [], isLoading: isLoadingNews } = useQuery<NewsItem[]>({
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
  const fetchNewsMutation = useMutation({
    mutationFn: (params?: { sourceType?: string; keywords?: string[] }) => 
      apiClient.fetchAndProcessNews(params),
    onSuccess: (data: any) => {
      if (data.taskId) {
        setProcessingTaskId(String(data.taskId));
      }
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: apiClient.exportToExcel,
    onSuccess: (data: any) => {
      window.open(data.fileUrl, '_blank');
      toast({
        title: "Экспорт завершен",
        description: `Экспортировано ${data.itemCount} новостей`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Remove keyword mutation
  const removeKeywordMutation = useMutation({
    mutationFn: apiClient.removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation({
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
    if (exportMutation.isPending) return;
    exportMutation.mutate({
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()) : undefined,
    }, {
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

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #1a237e 0%, #1976d2 60%, #00c6fb 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      {/* watermark логотип, если нужен */}
      <img
        src={vtbLogo}
        alt="ВТБ"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '40vw',
          minWidth: 300,
          maxWidth: 600,
          opacity: 0.10,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Контентная карточка */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 900,
          margin: '0 auto',
          marginTop: 64,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(26,35,126,0.18)',
          padding: '48px 32px 32px 32px',
          minHeight: 500,
          backdropFilter: 'blur(2px)',
        }}
      >
        <header className="flex items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mr-4 shadow-lg">
            <img src={vtbLogo} alt="ВТБ" style={{ width: '100%', height: '100%' }} />
          </div>
          <h1 className="text-3xl font-bold text-white">ВТБ | Мониторинг налогового законодательства</h1>
        </header>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Главная</h1>
              <p className="text-muted-foreground text-white">
                Система мониторинга налогового законодательства и документов
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleFetchNews}
                disabled={fetchNewsMutation.isPending || !!processingTaskId}
              >
                {fetchNewsMutation.isPending ? "Загрузка..." : "Обновить новости"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? "Экспорт..." : "Выгрузить в Excel"}
              </Button>
              {selectedNewsIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Отправить выбранное ({selectedNewsIds.length})
                </Button>
              )}
            </div>
          </div>

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              {apiError}
            </Alert>
          )}

          <Separator />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-white">
                <Filter className="mr-2 h-4 w-4" />
                Параметры поиска
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dateRange" className="text-white">Период публикации</Label>
                    <FilterCalendar
                      selectedDateFrom={dateFrom}
                      selectedDateTo={dateTo}
                      onDateFromSelect={setDateFrom}
                      onDateToSelect={setDateTo}
                      onRangeSelect={handleDateRangeSelect}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sourceType" className="text-white block mb-2">
                      Источник информации
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={sourceType === undefined ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSourceType(undefined)}
                      >
                        Все источники
                      </Button>
                      <Button
                        variant={sourceType === "website" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSourceType("website")}
                      >
                        Официальные сайты
                      </Button>
                      <Button
                        variant={sourceType === "telegram" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSourceType("telegram")}
                      >
                        Telegram-каналы
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="keywords" className="text-white">Ключевые слова</Label>
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
            </CardContent>
          </Card>

          {/* News Items */}
          <div className="space-y-4">
            {isLoadingNews ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-white/10 backdrop-blur-lg">
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : newsItems.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-lg">
                <CardContent className="py-8">
                  <div className="text-center text-white">
                    <p>Новости не найдены</p>
                    <p className="text-sm text-white/70 mt-1">Попробуйте изменить параметры поиска или обновить список</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Найдено новостей: {newsItems.length}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllNews}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white hover:bg-white/20"
                    >
                      {selectedNewsIds.length === newsItems.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      {selectedNewsIds.length === newsItems.length ? 'Снять выделение' : 'Выбрать все'}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {newsItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`transition-colors bg-white/10 backdrop-blur-lg ${
                        selectedNewsIds.includes(item.id) ? 'ring-2 ring-blue-400 bg-blue-900/20' : ''
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
                                <CheckSquare className="h-5 w-5 text-blue-400" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400 hover:text-white" />
                              )}
                            </button>
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1a237e', fontWeight: 600 }}
                                >
                                  {item.title}
                                </a>
                              </CardTitle>
                              <CardDescription className="mt-1" style={{ color: '#444' }}>
                                {new Date(item.publishedAt).toLocaleString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p style={{ color: '#1a237e' }}>{item.summary}</p>
                          {(item.taxType || item.subject || item.position || item.documentRef) && (
                            <div className="grid gap-2 text-sm text-white/70">
                              {item.taxType && (
                                <div>
                                  <span className="font-medium">Тип налога:</span> {item.taxType}
                                </div>
                              )}
                              {item.subject && (
                                <div>
                                  <span className="font-medium">Тема:</span> {item.subject}
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
                          <div
                            style={{
                              marginTop: 12,
                              color: '#111',
                              fontStyle: 'italic',
                              fontWeight: 400,
                              fontSize: 15,
                            }}
                          >
                            #{item.sourceName}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
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
        </div>
      </div>
    </div>
  );
} 