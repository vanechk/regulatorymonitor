import { z } from "zod";

// Схемы для валидации данных
export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  isEnabled: z.boolean(),
  type: z.string()
});

export const KeywordSchema = z.object({
  id: z.string(),
  text: z.string()
});

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional().nullable(),
  summary: z.string(),
  sourceUrl: z.string(),
  sourceName: z.string(),
  sourceId: z.string().nullable(),
  documentRef: z.string().nullable(),
  taxType: z.string().nullable(),
  subject: z.string().nullable(),
  position: z.string().nullable(),
  publishedAt: z.string(),
});

export const ReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileUrl: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  keywordsUsed: z.string(),
  itemCount: z.number(),
  createdAt: z.string()
});

export const EmailSettingsSchema = z.object({
  email: z.string(),
  isEnabled: z.boolean(),
  summaryFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
});

// Типы на основе схем
export type Source = z.infer<typeof SourceSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type EmailSettings = z.infer<typeof EmailSettingsSchema>;

// API клиент
export const apiClient = {
  // Источники
  listSources: async (): Promise<Source[]> => {
    const response = await fetch('/api/sources');
    if (!response.ok) {
      let errorText = 'Ошибка загрузки источников';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return z.array(SourceSchema).parse(data);
  },

  toggleSource: async ({ id, isEnabled }: { id: string; isEnabled: boolean }): Promise<Source> => {
    const response = await fetch(`/api/sources/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled })
    });
    if (!response.ok) {
      let errorText = 'Ошибка обновления источника';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return SourceSchema.parse(data);
  },

  toggleSourcesByType: async ({ type, isEnabled }: { type: string; isEnabled: boolean }): Promise<void> => {
    await fetch(`/api/sources/toggle-by-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, isEnabled })
    });
  },

  toggleSourcesByIds: async ({ ids, isEnabled }: { ids: string[]; isEnabled: boolean }): Promise<void> => {
    await fetch(`/api/sources/toggle-by-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, isEnabled })
    });
  },

  deleteSource: async ({ id }: { id: string }): Promise<void> => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' });
  },

  addSource: async ({ name, url, type }: { name: string; url: string; type: string }): Promise<Source> => {
    const response = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, type })
    });
    if (!response.ok) {
      let errorText = 'Ошибка добавления источника';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return SourceSchema.parse(data);
  },

  // Ключевые слова
  listKeywords: async (): Promise<Keyword[]> => {
    const response = await fetch('/api/keywords');
    if (!response.ok) {
      let errorText = 'Ошибка загрузки ключевых слов';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return z.array(KeywordSchema).parse(data);
  },

  addKeyword: async ({ text }: { text: string }): Promise<Keyword> => {
    const response = await fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      let errorText = 'Ошибка добавления ключевого слова';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return KeywordSchema.parse(data);
  },

  removeKeyword: async ({ id }: { id: string }): Promise<void> => {
    await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
  },

  // Новости
  getNews: async ({ dateFrom, dateTo, keywords, sourceType }: {
    dateFrom?: string;
    dateTo?: string;
    keywords?: string[];
    sourceType?: string;
  }): Promise<NewsItem[]> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (keywords) params.append('keywords', keywords.join(','));
    if (sourceType) {
      params.append('sourceType', sourceType);
    }

    let response;
    try {
      response = await fetch(`/api/news?${params.toString()}`);
    } catch (err) {
      throw new Error('Сервер недоступен');
    }
    if (!response.ok) {
      let errorText = 'Ошибка загрузки новостей';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return z.array(NewsItemSchema).parse(data);
  },

  fetchAndProcessNews: async (params?: {
    sourceType?: string;
    keywords?: string[];
  }): Promise<{ taskId: string | null; message: string; status: string }> => {
    let response;
    try {
      response = await fetch('/api/news/fetch', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {})
      });
    } catch (err) {
      throw new Error('Сервер недоступен');
    }
    if (!response.ok) {
      throw new Error('Ошибка загрузки новостей');
    }
    const data = await response.json();
    return data;
  },

  getNewsProcessingStatus: async ({ taskId }: { taskId: string }): Promise<{ status: string }> => {
    const response = await fetch(`/api/news/status/${taskId}`);
    const data = await response.json();
    return data;
  },

  // Отчеты
  listReports: async (): Promise<Report[]> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch('/api/reports', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    });
    if (!response.ok) {
      let errorText = 'Ошибка загрузки отчетов';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    // На сервере возвращается объект { reports: [...] }
    // Для статистики нам нужна только длина массива, поэтому не жёстко валидируем схему
    return Array.isArray((data as any).reports) ? (data as any).reports as Report[] : [] as Report[];
  },

  exportToExcel: async ({ dateFrom, dateTo, keywords, sourceType }: {
    dateFrom?: string;
    dateTo?: string;
    keywords?: string[];
    sourceType?: string;
  }): Promise<{ reportId: string; fileUrl: string; itemCount: number }> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (keywords) params.append('keywords', keywords.join(','));
    if (sourceType) params.append('sourceType', sourceType);

    let response;
    try {
      response = await fetch(`/api/reports/export?${params.toString()}`);
    } catch (err) {
      throw new Error('Сервер недоступен');
    }
    if (!response.ok) {
      let errorText = 'Ошибка экспорта';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return data;
  },

  exportCurrentNewsToExcel: async ({ newsIds, dateFrom, dateTo, keywords, sourceType }: {
    newsIds: string[];
    dateFrom?: string;
    dateTo?: string;
    keywords?: string[];
    sourceType?: string;
  }): Promise<{ reportId: string; fileUrl: string; itemCount: number }> => {
    let response;
    try {
      response = await fetch('/api/reports/export-current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsIds, dateFrom, dateTo, keywords, sourceType })
      });
    } catch (err) {
      throw new Error('Сервер недоступен');
    }
    if (!response.ok) {
      let errorText = 'Ошибка экспорта выбранных новостей';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return data;
  },

  // Настройки email
  getEmailSettings: async (): Promise<EmailSettings> => {
    const response = await fetch('/api/email-settings');
    const data = await response.json();
    return EmailSettingsSchema.parse(data);
  },

  updateEmailSettings: async ({ email, isEnabled, summaryFrequency }: {
    email: string;
    isEnabled: boolean;
    summaryFrequency: string;
  }): Promise<EmailSettings> => {
    const response = await fetch('/api/email-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isEnabled, summaryFrequency })
    });
    if (!response.ok) {
      let errorText = 'Ошибка обновления настроек email';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    const data = await response.json();
    return EmailSettingsSchema.parse(data);
  },

  sendNewsEmailSummary: async ({ email }: { email: string }): Promise<{ success: boolean; message: string }> => {
    const response = await fetch('/api/email-settings/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    return data;
  },

  // Отправка выбранных новостей на email
  sendSelectedNewsEmail: async ({
    email,
    newsIds,
    subject,
    message,
  }: {
    email: string;
    newsIds: string[];
    subject?: string;
    message?: string;
  }) => {
    // Получаем токен для авторизации
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch('/api/news/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        email,
        newsIds,
        subject,
        message,
      }),
    });

    if (!response.ok) {
      let errorText = 'Ошибка при отправке email';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  },

  // Отправка отчёта в Telegram
  sendTelegramReport: async ({ text }: { text: string }): Promise<{ ok: boolean; message: string }> => {
    // Получаем токен для авторизации
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch('/api/telegram/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      let errorText = 'Ошибка отправки в Telegram';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }
    return response.json();
  },

  // Тестовый экспорт пустого Excel файла
  testExportEmptyExcel: async (): Promise<{ reportId: string; fileUrl: string; itemCount: number }> => {
    const response = await fetch('/api/reports/test-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorText = 'Ошибка при тестовом экспорте';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  },

  // Удаление отчета
  deleteReport: async (reportId: string): Promise<{ message: string; deletedReportId: string }> => {
    // Получаем токен для авторизации
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    if (!response.ok) {
      let errorText = 'Ошибка при удалении отчета';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  },

  // Telegram настройки
  getTelegramSettings: async (): Promise<{ settings: any }> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch('/api/reports/settings/telegram', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    if (!response.ok) {
      let errorText = 'Ошибка получения настроек Telegram';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  },

  updateTelegramSettings: async (settings: any): Promise<{ message: string; settings: any }> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch('/api/reports/settings/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      let errorText = 'Ошибка обновления настроек Telegram';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  },

  testTelegramConnection: async (): Promise<{ success: boolean }> => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch('/api/reports/test/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });

    if (!response.ok) {
      let errorText = 'Ошибка тестирования Telegram соединения';
      try {
        const error = await response.json();
        errorText = error.error || errorText;
      } catch (e) {}
      throw new Error(errorText);
    }

    return response.json();
  }
};
