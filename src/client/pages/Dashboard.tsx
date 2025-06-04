import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Keyword, type NewsItem } from '../../client/api';
import { useToast } from '../../client/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { DatePicker } from '../../components/ui/date-picker';
import { Badge } from '../../components/ui/badge';
import { Filter, ChevronRight, FileText } from 'lucide-react';

function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterKeywords, setFilterKeywords] = useState<string>("");
  const [sourceType, setSourceType] = useState<string | undefined>(undefined);

  // Fetch news
  const { data: newsItems = [], isLoading: isLoadingNews } = useQuery<NewsItem[]>({
    queryKey: ['news', { dateFrom, dateTo, filterKeywords, sourceType }],
    queryFn: () => apiClient.getNews({
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()) : undefined,
      sourceType,
    }),
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

  // Fetch and process news mutation
  const fetchNewsMutation = useMutation({
    mutationFn: apiClient.fetchAndProcessNews,
    onSuccess: (data: any) => {
      if (data.taskId) {
        setProcessingTaskId(String(data.taskId));
      }
    },
  });

  // Export to Excel mutation
  const exportMutation = useMutation({
    mutationFn: apiClient.exportToExcel,
    onSuccess: (data: any) => {
      window.open(data.fileUrl, '_blank');
      toast({
        title: 'Отчет сгенерирован',
        description: `Экспортировано ${data.itemCount} новостей`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const removeKeywordMutation = useMutation({
    mutationFn: apiClient.removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: apiClient.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Источник удален",
      });
    },
  });

  const handleRemoveKeyword = (id: string) => {
    removeKeywordMutation.mutate({ id });
  };

  const handleDeleteSource = (id: string) => {
    deleteSourceMutation.mutate({ id });
  };

  const handleFetchNews = () => {
    if (fetchNewsMutation.isPending) return;
    fetchNewsMutation.mutate();
  };

  const handleExport = () => {
    if (exportMutation.isPending) return;
    exportMutation.mutate({
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      keywords: filterKeywords ? filterKeywords.split(',').map(k => k.trim()) : undefined,
    });
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
          >
            {fetchNewsMutation.isPending ? "Загрузка..." : "Загрузить новости"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Экспорт..." : "Экспорт в Excel"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateFrom">Дата с</Label>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Дата по</Label>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  className="w-full mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sourceType" className="block mb-2">
                  Тип источника
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
                    Веб-сайты
                  </Button>
                  <Button
                    variant={sourceType === "telegram" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSourceType("telegram")}
                  >
                    Telegram
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="keywords">Ключевые слова</Label>
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
              <Card key={i}>
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
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Нет новостей для отображения
              </div>
            </CardContent>
          </Card>
        ) : (
          newsItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {item.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(item.publishedAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{item.source.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.keywords.map((keyword) => (
                    <Badge key={keyword.id} variant="secondary">
                      {keyword.text}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard; 