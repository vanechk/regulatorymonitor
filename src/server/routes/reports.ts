import express from 'express';
import { authMiddleware, requireRole, logUserAction } from '../middleware/auth';
import { EmailService } from '../utils/email';
import { TelegramService } from '../utils/telegram';
import { db } from '../db';
import { z } from 'zod';

const router = express.Router();

// Схемы валидации
const reportRequestSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  email: z.string().email().optional(),
  telegramChatId: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  taxType: z.string().optional(),
  subject: z.string().optional()
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.number().min(1).max(65535),
  smtpUser: z.string().email(),
  smtpPass: z.string().min(1),
  smtpSecure: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
  summaryFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY')
});

const telegramSettingsSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
  isEnabled: z.boolean().default(true),
  summaryFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY')
});

// Получение отчетов пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const reports = await db.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ reports });
  } catch (error) {
    console.error('Ошибка получения отчетов:', error);
    res.status(500).json({ error: 'Ошибка получения отчетов' });
  }
});

// Создание и отправка отчета
router.post('/generate', authMiddleware, logUserAction('REPORT_GENERATED'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Валидация входных данных
    const validation = reportRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.error.errors
      });
    }

    const { dateFrom, dateTo, email, telegramChatId, keywords, taxType, subject } = validation.data;

    // Построение фильтра для новостей
    const whereClause: any = {
      publishedAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    };

    if (keywords && keywords.length > 0) {
      whereClause.keywords = {
        some: {
          text: {
            in: keywords
          }
        }
      };
    }

    if (taxType) {
      whereClause.taxType = taxType;
    }

    if (subject) {
      whereClause.subject = subject;
    }

    // Получаем новости по фильтру
    const newsItems = await db.newsItem.findMany({
      where: whereClause,
      include: {
        keywords: true,
        source: true
      },
      orderBy: { publishedAt: 'desc' }
    });

    // Создаем запись отчета в БД
    const report = await db.report.create({
      data: {
        userId,
        name: `Отчет за ${new Date(dateFrom).toLocaleDateString('ru-RU')} - ${new Date(dateTo).toLocaleDateString('ru-RU')}`,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        itemCount: newsItems.length,
        keywordsUsed: keywords ? keywords.join(', ') : null,
        fileUrl: '' // Пока оставляем пустым
      }
    });

    let emailSent = false;
    let telegramSent = false;

    // Отправляем на email если указан
    if (email) {
      try {
        await EmailService.sendNewsReport(email, newsItems, new Date(dateFrom), new Date(dateTo), userId);
        emailSent = true;
        console.log(`Отчет отправлен на email: ${email}`);
      } catch (error) {
        console.error('Ошибка отправки email:', error);
      }
    }

    // Отправляем в телеграм если указан chatId
    if (telegramChatId) {
      try {
        const success = await TelegramService.sendNewsReport(telegramChatId, newsItems, new Date(dateFrom), new Date(dateTo), userId);
        telegramSent = success;
        if (success) {
          console.log(`Отчет отправлен в Telegram: ${telegramChatId}`);
        }
      } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
      }
    }

    res.json({
      message: 'Отчет сгенерирован успешно',
      report,
      stats: {
        newsCount: newsItems.length,
        emailSent,
        telegramSent
      }
    });

  } catch (error) {
    console.error('Ошибка генерации отчета:', error);
    res.status(500).json({ error: 'Ошибка генерации отчета' });
  }
});

// Настройки email
router.get('/settings/email', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const settings = await db.emailSettings.findUnique({
      where: { userId }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Ошибка получения email настроек:', error);
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
});

router.post('/settings/email', authMiddleware, logUserAction('EMAIL_SETTINGS_UPDATED'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Валидация входных данных
    const validation = emailSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.error.errors
      });
    }

    const settings = validation.data;

    // Проверяем SMTP соединение
    try {
      const isConnected = await EmailService.testConnection(userId);
      if (!isConnected) {
        return res.status(400).json({ error: 'Не удается подключиться к SMTP серверу' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Ошибка проверки SMTP соединения' });
    }

    // Сохраняем настройки
    const emailSettings = await db.emailSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        email: settings.smtpUser, // Используем smtpUser как email
        ...settings
      }
    });

    res.json({
      message: 'Email настройки сохранены',
      settings: emailSettings
    });

  } catch (error) {
    console.error('Ошибка сохранения email настроек:', error);
    res.status(500).json({ error: 'Ошибка сохранения настроек' });
  }
});

// Настройки Telegram
router.get('/settings/telegram', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const settings = await db.telegramSettings.findUnique({
      where: { userId }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Ошибка получения Telegram настроек:', error);
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
});

router.post('/settings/telegram', authMiddleware, logUserAction('TELEGRAM_SETTINGS_UPDATED'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Валидация входных данных
    const validation = telegramSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.error.errors
      });
    }

    const settings = validation.data;

    // Проверяем Telegram соединение
    try {
      const isConnected = await TelegramService.testConnection(userId);
      if (!isConnected) {
        return res.status(400).json({ error: 'Не удается подключиться к Telegram боту' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Ошибка проверки Telegram соединения' });
    }

    // Сохраняем настройки
    const telegramSettings = await db.telegramSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    res.json({
      message: 'Telegram настройки сохранены',
      settings: telegramSettings
    });

  } catch (error) {
    console.error('Ошибка сохранения Telegram настроек:', error);
    res.status(500).json({ error: 'Ошибка сохранения настроек' });
  }
});

// Тестирование email настроек
router.post('/test/email', authMiddleware, logUserAction('EMAIL_TEST_SENT'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    await EmailService.sendTestEmail(email, userId);

    res.json({ message: 'Тестовое письмо отправлено' });
  } catch (error) {
    console.error('Ошибка отправки тестового email:', error);
    res.status(500).json({ error: 'Ошибка отправки тестового письма' });
  }
});

// Тестирование Telegram настроек
router.post('/test/telegram', authMiddleware, logUserAction('TELEGRAM_TEST_SENT'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID обязателен' });
    }

    const success = await TelegramService.sendTestMessage(chatId, userId);
    
    if (success) {
      res.json({ message: 'Тестовое сообщение отправлено в Telegram' });
    } else {
      res.status(500).json({ error: 'Не удалось отправить тестовое сообщение' });
    }
  } catch (error) {
    console.error('Ошибка отправки тестового сообщения в Telegram:', error);
    res.status(500).json({ error: 'Ошибка отправки тестового сообщения' });
  }
});

// Получение статистики по отчетам
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const totalReports = await db.report.count({
      where: { userId }
    });

    const recentReports = await db.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const emailSettings = await db.emailSettings.findUnique({
      where: { userId }
    });

    const telegramSettings = await db.telegramSettings.findUnique({
      where: { userId }
    });

    res.json({
      totalReports,
      recentReports,
      emailEnabled: emailSettings?.isEnabled || false,
      telegramEnabled: telegramSettings?.isEnabled || false
    });

  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// ВРЕМЕННЫЙ endpoint для тестирования отчетов без авторизации
router.get('/test-list', async (req, res) => {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      total: reports.length,
      reports: reports.map(report => ({
        id: report.id,
        name: report.name,
        userId: report.userId,
        itemCount: report.itemCount,
        createdAt: report.createdAt,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo
      }))
    });
  } catch (error) {
    console.error('Ошибка получения отчетов:', error);
    res.status(500).json({ error: 'Ошибка получения отчетов' });
  }
});

// ВРЕМЕННЫЙ endpoint для создания тестового отчета
router.post('/test-create', async (req, res) => {
  try {
    // Найдем первого пользователя для теста
    const firstUser = await db.user.findFirst();
    if (!firstUser) {
      return res.status(400).json({ error: 'Нет пользователей в системе' });
    }

    // Создаем тестовый отчет
    const report = await db.report.create({
      data: {
        userId: firstUser.id,
        name: `Тестовый отчет ${new Date().toLocaleString('ru-RU')}`,
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
        dateTo: new Date(),
        itemCount: 15,
        keywordsUsed: 'налоги, НДС, отчетность',
        fileUrl: '/reports/test-report.pdf'
      }
    });

    res.json({
      message: 'Тестовый отчет создан',
      report
    });
  } catch (error) {
    console.error('Ошибка создания тестового отчета:', error);
    res.status(500).json({ error: 'Ошибка создания отчета' });
  }
});

// Удаление отчета
router.delete('/:id', authMiddleware, logUserAction('REPORT_DELETED'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { id } = req.params;
    
    // Проверяем, что отчет принадлежит пользователю
    const report = await db.report.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден или у вас нет прав на его удаление' });
    }

    // Удаляем отчет
    await db.report.delete({
      where: { id }
    });

    console.log(`📊 Отчет ${id} удален пользователем ${userId}`);

    res.json({
      message: 'Отчет успешно удален',
      deletedReportId: id
    });

  } catch (error) {
    console.error('Ошибка удаления отчета:', error);
    res.status(500).json({ error: 'Ошибка удаления отчета' });
  }
});

export default router;
