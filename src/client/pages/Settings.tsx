import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Source, type Keyword } from '../../client/api';
import { useToast } from '../../client/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Separator, Badge, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertTitle, AlertDescription, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui';
import { Mail, Plus, Trash2, X, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

function Settings() {
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
  const [telegramChannel, setTelegramChannel] = useState(() => localStorage.getItem('telegramChannel') || '');

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
  const toggleSourceMutation = useMutation({
    mutationFn: apiClient.toggleSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  // Toggle sources by type mutation
  const toggleSourcesByTypeMutation = useMutation({
    mutationFn: apiClient.toggleSourcesByType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  // Toggle sources by ids mutation
  const toggleSourcesByIdsMutation = useMutation({
    mutationFn: apiClient.toggleSourcesByIds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
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

  // Add source mutation
  const addSourceMutation = useMutation({
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
  const updateEmailSettingsMutation = useMutation({
    mutationFn: apiClient.updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast({
        title: "Настройки email обновлены",
      });
    },
  });

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: apiClient.sendNewsEmailSummary,
    onSuccess: () => {
      toast({
        title: "Тестовое письмо отправлено",
        description: "Проверьте ваш почтовый ящик",
      });
    },
  });

  // Add keyword mutation
  const addKeywordMutation = useMutation({
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

  // Фильтрация источников без пустых name и url
  const websiteSources = sources.filter(
    (source) => source.type === "website" && source.name.trim() && source.url.trim()
  );
  const telegramSources = sources.filter(
    (source) => source.type === "telegram" && source.name.trim() && source.url.trim()
  );

  const handleSaveTelegramChannel = () => {
    localStorage.setItem('telegramChannel', telegramChannel);
    toast({ title: 'Адрес Telegram-канала сохранён' });
  };

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
            <Collapsible open={websiteGroupOpen} onOpenChange={setWebsiteGroupOpen}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Веб-сайты</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className={cn("h-4 w-4 transition-transform", websiteGroupOpen && "rotate-90")} />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
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
            <Collapsible open={telegramGroupOpen} onOpenChange={setTelegramGroupOpen}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Telegram-каналы</h3>
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
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className={cn("h-4 w-4 transition-transform", telegramGroupOpen && "rotate-90")} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent>
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
              <Collapsible key={group.id}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{group.name}</h3>
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
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
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

                <div className="space-y-2">
                  <Label htmlFor="telegramChannel">Telegram-канал</Label>
                  <Input
                    id="telegramChannel"
                    type="text"
                    value={telegramChannel}
                    onChange={e => setTelegramChannel(e.target.value)}
                    placeholder="@your_channel или ссылка"
                    className="w-full mt-1"
                  />
                  <Button type="button" onClick={handleSaveTelegramChannel} style={{ marginTop: 8 }}>Сохранить Telegram-канал</Button>
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

export default Settings; 