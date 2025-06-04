import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type Source, type Keyword, type NewsItem, type Report, type EmailSettings } from "./src/client/api";
import { useToast } from "./src/client/utils";
import { type QueryKeys, type MutationKeys } from "./src/types/react-query";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Settings,
  Home,
  RefreshCw,
  Download,
  Plus,
  X,
  ChevronRight,
  FileText,
  Calendar,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Mail,
  Users,
  Layers,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Badge,
  Checkbox,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
  DatePicker,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./src/components/ui";

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">TaxNewsRadar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Налоговый мониторинг
            </p>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Дашборд
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant={
                  location.pathname === "/settings" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Button>
            </Link>
            <Link to="/reports">
              <Button
                variant={
                  location.pathname === "/reports" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Отчеты
              </Button>
            </Link>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="md:hidden border-b p-4 bg-card">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">TaxNewsRadar</h1>
              <div className="flex space-x-2">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="ghost" size="icon">
                    <FileSpreadsheet className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Dashboard page
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
  const fetchNewsMutation = useMutation<MutationKeys['fetchNews']['data'], Error, MutationKeys['fetchNews']['variables']>({
    mutationFn: apiClient.fetchAndProcessNews,
    onSuccess: (data) => {
      if (data.taskId) {
        setProcessingTaskId(String(data.taskId));
      }
    },
  });

  // Export to Excel mutation
  const exportMutation = useMutation<MutationKeys['exportToExcel']['data'], Error, MutationKeys['exportToExcel']['variables']>({
    mutationFn: apiClient.exportToExcel,
    onSuccess: (data) => {
      window.open(data.fileUrl, '_blank');
      toast({
        title: 'Отчет сгенерирован',
        description: `Экспортировано ${data.itemCount} новостей`,
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const removeKeywordMutation = useMutation<MutationKeys['removeKeyword']['data'], Error, MutationKeys['removeKeyword']['variables']>({
    mutationFn: apiClient.removeKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });

  const deleteSourceMutation = useMutation<MutationKeys['deleteSource']['data'], Error, MutationKeys['deleteSource']['variables']>({
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
                    Telegram-каналы
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="keywords" className="block mb-2">
                  Ключевые слова (через запятую)
                </Label>
                <Input
                  id="keywords"
                  value={filterKeywords}
                  onChange={(e) => setFilterKeywords(e.target.value)}
                  placeholder="Например: НДС, налог на прибыль"
                  className="mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 5).map((keyword) => (
                    <Badge
                      key={keyword.id}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        const currentKeywords = filterKeywords
                          .split(",")
                          .map((k) => k.trim())
                          .filter((k) => k !== "");

                        if (!currentKeywords.includes(keyword.text)) {
                          setFilterKeywords(
                            currentKeywords.length > 0
                              ? `${filterKeywords}, ${keyword.text}`
                              : keyword.text,
                          );
                        }
                      }}
                    >
                      {keyword.text}
                    </Badge>
                  ))}
                  {keywords.length > 5 && (
                    <Badge variant="outline">+{keywords.length - 5}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Результаты ({newsItems.length})
        </h2>

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
          <div className="space-y-4">
            {newsItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge variant="outline">
                      {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
                    </Badge>
                  </div>
                  <CardDescription>
                    Источник: {item.sourceName}
                    {item.documentRef && ` | ${item.documentRef}`}
                    {item.taxType && ` | ${item.taxType}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{item.summary}</p>
                  {item.subject && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        Предмет рассмотрения:
                      </span>
                      <p className="text-sm">{item.subject}</p>
                    </div>
                  )}
                  {item.position && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        Позиция МФ/ФНС:
                      </span>
                      <p className="text-sm">{item.position}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.open(item.sourceUrl, "_blank");
                      // Если это Telegram-канал без прямой ссылки на сообщение
                      if (
                        item.sourceUrl.includes("t.me/") &&
                        !item.sourceUrl.includes("t.me/s/") &&
                        !item.sourceUrl.includes("t.me/c/") &&
                        !item.sourceUrl.includes("/")
                      ) {
                        toast({
                          title: "Внимание",
                          description:
                            "Ссылка ведет на общий канал Telegram, а не на конкретное сообщение",
                          variant: "default",
                        });
                      }
                    }}
                  >
                    Перейти к источнику
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Settings page
function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState("website");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState("DAILY");
  const [websiteGroupOpen, setWebsiteGroupOpen] = useState(true);
  const [telegramGroupOpen, setTelegramGroupOpen] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [sourceGroups, setSourceGroups] = useState<
    Array<{ id: string; name: string; sources: Source[] }>
  >([]);

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

  // Initialize source groups
  useEffect(() => {
    if (sources && sources.length > 0) {
      // You could load groups from localStorage or an API
      // For now, we'll just create a default group if none exists
      if (sourceGroups.length === 0) {
        setSourceGroups([
          {
            id: "official",
            name: "Официальные источники",
            sources: sources.filter(
              (s) =>
                s.name.includes("ФНС") ||
                s.name.includes("Минфин") ||
                s.name.includes("Правительство"),
            ),
          },
          {
            id: "commercial",
            name: "Коммерческие источники",
            sources: sources.filter(
              (s) =>
                s.name.includes("Консультант") ||
                s.name.includes("Групп") ||
                s.name.includes("B1"),
            ),
          },
        ]);
      }
    }
  }, [sources]);

  // Toggle source mutation
  const toggleSourceMutation = useMutation<MutationKeys['toggleSource']['data'], Error, MutationKeys['toggleSource']['variables']>({
    mutationFn: apiClient.toggleSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  // Toggle sources by type mutation
  const toggleSourcesByTypeMutation = useMutation<MutationKeys['toggleSourcesByType']['data'], Error, MutationKeys['toggleSourcesByType']['variables']>({
    mutationFn: apiClient.toggleSourcesByType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  // Toggle sources by ids mutation
  const toggleSourcesByIdsMutation = useMutation<MutationKeys['toggleSourcesByIds']['data'], Error, MutationKeys['toggleSourcesByIds']['variables']>({
    mutationFn: apiClient.toggleSourcesByIds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation<MutationKeys['deleteSource']['data'], Error, MutationKeys['deleteSource']['variables']>({
    mutationFn: apiClient.deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Источник удален",
      });
    },
  });

  // Add source mutation
  const addSourceMutation = useMutation<MutationKeys['addSource']['data'], Error, MutationKeys['addSource']['variables']>({
    mutationFn: apiClient.addSource,
    onSuccess: () => {
      setNewSourceName("");
      setNewSourceUrl("");
      setNewSourceType("website");
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast({
        title: "Источник добавлен",
      });
    },
  });

  // Update email settings mutation
  const updateEmailSettingsMutation = useMutation<MutationKeys['updateEmailSettings']['data'], Error, MutationKeys['updateEmailSettings']['variables']>({
    mutationFn: apiClient.updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: "Настройки email обновлены",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation<MutationKeys['sendTestEmail']['data'], Error, MutationKeys['sendTestEmail']['variables']>({
    mutationFn: apiClient.sendNewsEmailSummary,
    onSuccess: () => {
      toast({
        title: "Тестовое письмо отправлено",
        description: "Проверьте ваш почтовый ящик",
      });
    },
  });

  // Add keyword mutation
  const addKeywordMutation = useMutation<MutationKeys['addKeyword']['data'], Error, MutationKeys['addKeyword']['variables']>({
    mutationFn: apiClient.addKeyword,
    onSuccess: () => {
      setNewKeyword("");
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast({
        title: "Ключевое слово добавлено",
      });
    },
  });

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeywordMutation.mutate({ text: newKeyword.trim() });
    }
  };

  const handleAddSource = () => {
    if (addSourceMutation.isPending) return;
    addSourceMutation.mutate({
      name: newSourceName,
      url: newSourceUrl,
      type: newSourceType,
    });
  };

  const handleUpdateEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailAddress.trim()) {
      updateEmailSettingsMutation.mutate({
        email: emailAddress.trim(),
        isEnabled: emailEnabled,
        summaryFrequency: emailFrequency,
      });
    }
  };

  const handleSendTestEmail = () => {
    if (emailAddress.trim()) {
      sendTestEmailMutation.mutate({ email: emailAddress.trim() });
    }
  };

  // Source group management functions
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      sources: [],
    };

    setSourceGroups([...sourceGroups, newGroup]);
    setNewGroupName("");

    toast({
      title: "Группа создана",
      description: `Группа "${newGroupName}" успешно создана`,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setSourceGroups(sourceGroups.filter((group) => group.id !== groupId));

    toast({
      title: "Группа удалена",
    });
  };

  const handleAddToGroup = (groupId: string, sourceId: string) => {
    const source = sources.find((s) => s.id === sourceId);
    if (!source) return;

    setSourceGroups(
      sourceGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            sources: [...group.sources, source],
          };
        }
        return group;
      }),
    );
  };

  const handleRemoveFromGroup = (groupId: string, sourceId: string) => {
    setSourceGroups(
      sourceGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            sources: group.sources.filter((s) => s.id !== sourceId),
          };
        }
        return group;
      }),
    );
  };

  const handleDeleteSource = (id: string) => {
    deleteSourceMutation.mutate({ id });
  };

  const websiteSources = sources.filter((source) => source.type === "website");
  const telegramSources = sources.filter(
    (source) => source.type === "telegram",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управление источниками и ключевыми словами
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Источники</TabsTrigger>
          <TabsTrigger value="keywords">Ключевые слова</TabsTrigger>
          <TabsTrigger value="email">Уведомления и отчеты</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить новый источник</CardTitle>
              <CardDescription>
                Добавьте новый источник для мониторинга
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceName">Название источника</Label>
                  <Input
                    id="sourceName"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Например: Налоговый портал"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">URL источника</Label>
                  <Input
                    id="sourceUrl"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="Например: https://example.com или t.me/channel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceType">Тип источника</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={
                        newSourceType === "website" ? "default" : "outline"
                      }
                      onClick={() => setNewSourceType("website")}
                    >
                      Веб-сайт
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newSourceType === "telegram" ? "default" : "outline"
                      }
                      onClick={() => setNewSourceType("telegram")}
                    >
                      Telegram-канал
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={addSourceMutation.isPending}
                >
                  {addSourceMutation.isPending ? "Добавление..." : "Добавить источник"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Sources grouping management */}
            <div className="flex flex-col space-y-2">
              <Label className="text-lg font-semibold">
                Группировка источников
              </Label>
              <div className="text-sm text-muted-foreground mb-2">
                Вы можете создавать группы источников для удобного управления
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Название новой группы"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button
                  onClick={handleAddGroup}
                  disabled={!newGroupName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </div>

            <Separator />

            {/* Website sources with collapsible groups */}
            <Collapsible
              open={websiteGroupOpen}
              onOpenChange={setWebsiteGroupOpen}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <CollapsibleTrigger>
                  <button
                    type="button"
                    className="flex items-center p-0 hover:bg-transparent text-sm font-medium bg-transparent border-0"
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${websiteGroupOpen ? "rotate-90" : ""}`}
                    />
                    <h3 className="text-lg font-semibold ml-2">Веб-сайты</h3>
                  </button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={websiteSources.some((s) => s.isEnabled)}
                    onCheckedChange={(checked) => {
                      toggleSourcesByTypeMutation.mutate({
                        type: "website",
                        isEnabled: checked,
                      });
                      toast({
                        title: checked
                          ? "Все веб-сайты включены"
                          : "Все веб-сайты отключены",
                      });
                    }}
                  />
                  <Badge>{websiteSources.length}</Badge>
                </div>
              </div>

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
                          <div
                            key={source.id}
                            className="flex items-center justify-between border-b pb-2 last:border-0"
                          >
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={source.isEnabled}
                                onCheckedChange={(checked) => {
                                  toggleSourceMutation.mutate({
                                    id: source.id,
                                    isEnabled: checked,
                                  });
                                }}
                              />
                              <Label>{source.name}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {source.url}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
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

            {/* Telegram sources with collapsible groups */}
            <Collapsible
              open={telegramGroupOpen}
              onOpenChange={setTelegramGroupOpen}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <CollapsibleTrigger>
                  <button
                    type="button"
                    className="flex items-center p-0 hover:bg-transparent text-sm font-medium bg-transparent border-0"
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${telegramGroupOpen ? "rotate-90" : ""}`}
                    />
                    <h3 className="text-lg font-semibold ml-2">Telegram-каналы</h3>
                  </button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={telegramSources.some((s) => s.isEnabled)}
                    onCheckedChange={(checked) => {
                      toggleSourcesByTypeMutation.mutate({
                        type: "telegram",
                        isEnabled: checked,
                      });
                      toast({
                        title: checked
                          ? "Все Telegram-каналы включены"
                          : "Все Telegram-каналы отключены",
                      });
                    }}
                  />
                  <Badge>{telegramSources.length}</Badge>
                </div>
              </div>

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
                          <div
                            key={source.id}
                            className="flex items-center justify-between border-b pb-2 last:border-0"
                          >
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={source.isEnabled}
                                onCheckedChange={(checked) => {
                                  toggleSourceMutation.mutate({
                                    id: source.id,
                                    isEnabled: checked,
                                  });
                                }}
                              />
                              <Label>{source.name}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {source.url}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
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

            {/* Custom source groups */}
            {sourceGroups.map((group) => (
              <Collapsible key={group.id} className="w-full">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger>
                    <button
                      type="button"
                      className="flex items-center p-0 hover:bg-transparent text-sm font-medium bg-transparent border-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <h3 className="text-lg font-semibold ml-2">{group.name}</h3>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={group.sources.some((s) => s.isEnabled)}
                      onCheckedChange={(checked) => {
                        const sourceIds = group.sources.map((s) => s.id);
                        if (sourceIds.length === 0) return;

                        toggleSourcesByIdsMutation.mutate({
                          ids: sourceIds,
                          isEnabled: checked,
                        });
                        toast({
                          title: checked
                            ? `Группа "${group.name}" включена`
                            : `Группа "${group.name}" отключена`,
                        });
                      }}
                    />
                    <Badge>{group.sources.length}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CollapsibleContent className="mt-2">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {group.sources.map((source) => (
                          <div
                            key={source.id}
                            className="flex items-center justify-between border-b pb-2 last:border-0"
                          >
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={source.isEnabled}
                                onCheckedChange={(checked) => {
                                  toggleSourceMutation.mutate({
                                    id: source.id,
                                    isEnabled: checked,
                                  });
                                }}
                              />
                              <Label>{source.name}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {source.type === "website"
                                  ? "Веб-сайт"
                                  : "Telegram"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  handleRemoveFromGroup(group.id, source.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Add source to group */}
                        <div className="pt-2">
                          <Select
                            onValueChange={(value) =>
                              handleAddToGroup(group.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Добавить источник в группу" />
                            </SelectTrigger>
                            <SelectContent>
                              {sources
                                .filter(
                                  (source) =>
                                    !group.sources.some(
                                      (s) => s.id === source.id,
                                    ),
                                )
                                .map((source) => (
                                  <SelectItem key={source.id} value={source.id}>
                                    {source.name} (
                                    {source.type === "website"
                                      ? "Веб-сайт"
                                      : "Telegram"}
                                    )
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ключевые слова</CardTitle>
              <CardDescription>
                Добавьте ключевые слова для фильтрации новостей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddKeyword} className="flex space-x-2 mb-4">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Введите ключевое слово"
                />
                <Button
                  type="submit"
                  disabled={!newKeyword.trim() || addKeywordMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              </form>

              {isLoadingKeywords ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Нет ключевых слов</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {keyword.text}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => {}}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Совет</AlertTitle>
            <AlertDescription>
              Добавьте ключевые слова, связанные с налогами, которые вас
              интересуют. Например: НДС, НДФЛ, налог на прибыль, налоговый вычет
              и т.д.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки Email-уведомлений</CardTitle>
              <CardDescription>
                Настройте отправку сводки новостей на ваш email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmailSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email-адрес</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="example@example.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailEnabled"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                  <Label htmlFor="emailEnabled">Включить уведомления</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Частота отправки</Label>
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
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!emailAddress.trim()}>
                    Сохранить настройки
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={
                      !emailAddress.trim() || sendTestEmailMutation.isPending
                    }
                  >
                    {sendTestEmailMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      "Отправить тестовое письмо"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Суммаризация новостей</CardTitle>
              <CardDescription>
                Настройте автоматическое формирование сводки налоговых новостей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Как работает суммаризация</AlertTitle>
                  <AlertDescription>
                    Система автоматически формирует сводку новостей на основе
                    выбранных источников и ключевых слов. Сводка включает в себя
                    краткое содержание новостей, ссылки на источники и
                    информацию о налоговых документах. Вы можете получать эти
                    сводки на email с выбранной периодичностью.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Содержание сводки:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Новости с веб-сайтов налоговых органов</li>
                    <li>Новости из Telegram-каналов</li>
                    <li>Краткие описания документов и писем</li>
                    <li>Информация о налоговых изменениях</li>
                    <li>Ссылки на источники для подробного изучения</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted/40">
                <div className="flex flex-col space-y-4">
                  <h3 className="text-lg font-semibold">
                    Сформировать сводку новостей
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Нажмите кнопку ниже, чтобы немедленно сформировать и
                    отправить сводку новостей на указанный email
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="text-sm font-medium bg-primary/10 p-2 rounded-md w-full sm:w-auto">
                      {emailAddress || "Email не указан"}
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={handleSendTestEmail}
                      disabled={
                        !emailAddress.trim() || sendTestEmailMutation.isPending
                      }
                    >
                      {sendTestEmailMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Формирование...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Сформировать и отправить сейчас
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reports page
function ReportsPage() {
  // Fetch reports
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: apiClient.listReports,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Отчеты</h1>
        <p className="text-muted-foreground">История сгенерированных отчетов</p>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Нет отчетов</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Сгенерируйте отчет на странице Дашборд
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.name}</CardTitle>
                <CardDescription>
                  Создан: {new Date(report.createdAt).toLocaleString("ru-RU")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Период:{" "}
                      {new Date(report.dateFrom).toLocaleDateString("ru-RU")} -{" "}
                      {new Date(report.dateTo).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Количество записей: {report.itemCount}
                    </span>
                  </div>
                  {report.keywordsUsed && (
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Ключевые слова: {report.keywordsUsed}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => window.open(report.fileUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать Excel
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />
        <Route
          path="/reports"
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />
        {/* Catch-all route for any unmatched routes */}
        <Route
          path="*"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
