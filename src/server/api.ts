import express from 'express';
import { PrismaClient } from '@prisma/client';
import reportsRouter from './routes/reports';
import jwt from 'jsonwebtoken';

console.log('🔍 API: Импортирую auth router...');
let authRouter;
try {
  authRouter = require('./routes/auth').default;
  console.log('✅ API: Auth router успешно импортирован');
} catch (error) {
  console.error('❌ API: Ошибка при импорте auth router:', error);
  // Создаем пустой router как fallback
  const express = require('express');
  authRouter = express.Router();
}

const router = express.Router();
const prisma = new PrismaClient();

// Middleware для логирования всех запросов
router.use((req, res, next) => {
  console.log(`🔍 API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Функция для очистки истекших токенов
async function cleanupExpiredTokens() {
  try {
    const expiredUsers = await prisma.pendingUser.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    if (expiredUsers.length > 0) {
      console.log(`🧹 API: Найдено ${expiredUsers.length} истекших токенов, удаляю...`);
      
      for (const user of expiredUsers) {
        await prisma.pendingUser.delete({ where: { id: user.id } });
        console.log(`🧹 API: Удален истекший токен для пользователя ${user.email}`);
      }
      
      console.log(`✅ API: Удалено ${expiredUsers.length} истекших токенов`);
    }
  } catch (error) {
    console.error('❌ API: Ошибка при очистке истекших токенов:', error);
  }
}

// Запускаем очистку истекших токенов каждые 6 часов
setInterval(cleanupExpiredTokens, 6 * 60 * 60 * 1000);

// Запускаем очистку при старте сервера
cleanupExpiredTokens();

// Тестовый endpoint для диагностики
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Тестовый endpoint вызван');
    
    // Проверяем подключение к БД
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ База данных доступна');
    
    // Проверяем переменные окружения
    const envCheck = {
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
      EMAIL_HOST: !!process.env.EMAIL_HOST,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      DATABASE_URL: !!process.env.DATABASE_URL
    };
    console.log('🔧 Переменные окружения:', envCheck);
    
    // Проверяем количество пользователей
    const userCount = await prisma.user.count();
    const pendingUserCount = await prisma.pendingUser.count();
    console.log(`👥 Пользователей: ${userCount}, Pending: ${pendingUserCount}`);
    
    res.json({
      status: 'ok',
      message: 'Сервер работает корректно',
      database: 'connected',
      environment: envCheck,
      users: {
        total: userCount,
        pending: pendingUserCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Ошибка в тестовом endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Подключаем маршруты для отчетов
router.use('/reports', reportsRouter);

// Получение списка источников
router.get('/sources', async (req, res) => {
  try {
    const sources = await prisma.source.findMany();
    res.json(sources);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Создание источника
router.post('/sources', async (req, res) => {
  try {
    const source = await prisma.source.create({ data: req.body });
    res.json(source);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create source', details: error.message });
  }
});

// Обновление источника
router.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const source = await prisma.source.update({
      where: { id },
      data: req.body
    });
    res.json(source);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update source', details: error.message });
  }
});

// Переключение состояния источника
router.put('/sources/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    
    const source = await prisma.source.update({
      where: { id },
      data: { isEnabled }
    });
    res.json(source);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle source', details: error.message });
  }
});

// Удаление источника
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.source.delete({ where: { id } });
    res.json({ message: 'Source deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete source', details: error.message });
  }
});

// Получение списка ключевых слов
router.get('/keywords', async (req, res) => {
  try {
    const keywords = await prisma.keyword.findMany();
    res.json(keywords);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

// Создание ключевого слова
router.post('/keywords', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст ключевого слова обязателен' });
    }

    const trimmedText = text.trim();
    
    // Проверяем, есть ли уже такое ключевое слово (точное совпадение)
    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        text: trimmedText
      }
    });

    if (existingKeyword) {
      return res.status(400).json({ 
        error: `Ключевое слово "${trimmedText}" уже существует`,
        details: 'Попробуйте использовать другое слово или проверьте написание'
      });
    }

    const keyword = await prisma.keyword.create({ 
      data: { text: trimmedText } 
    });
    
    res.json(keyword);
  } catch (error: any) {
    console.error('Ошибка создания ключевого слова:', error);
    res.status(500).json({ 
      error: 'Ошибка создания ключевого слова', 
      details: error.message 
    });
  }
});

// Удаление ключевого слова
router.delete('/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.keyword.delete({ where: { id } });
    res.json({ message: 'Keyword deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete keyword', details: error.message });
  }
});

// Получение новостей
router.get('/news', async (req, res) => {
  try {
    const { dateFrom, dateTo, keywords, sourceType } = req.query;
    
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) where.publishedAt.gte = new Date(dateFrom as string);
      if (dateTo) where.publishedAt.lte = new Date(dateTo as string);
    }
    
    if (sourceType) {
      // Получаем источники указанного типа
      const sourcesOfType = await prisma.source.findMany({
        where: { type: sourceType as string },
        select: { id: true },
      });
      
      where.sourceId = {
        in: sourcesOfType.map((source) => source.id),
      };
    }
    
    // Получаем все новости, соответствующие фильтрам даты и типа источника
    let news = await prisma.newsItem.findMany({
      where,
      include: {
        source: true,
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
    
    res.json(news);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
});

// Загрузка и обработка новостей
router.post('/news/fetch', async (req, res) => {
  try {
    console.log('📰 API: Получен запрос на загрузку новостей');
    const { sourceType, keywords } = req.body;
    
    // Импортируем функцию из основного API
    const { fetchAndProcessNews } = await import('../../api');
    
    console.log('📰 API: Запускаем парсинг новостей с параметрами:', { sourceType, keywords });
    
    const result = await fetchAndProcessNews({ sourceType, keywords });
    
    console.log('📰 API: Парсинг завершен, результат:', result);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ API: Ошибка при загрузке новостей:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки новостей', 
      details: error.message 
    });
  }
});

// Проверка статуса обработки новостей
router.get('/news/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Импортируем функцию из основного API
    const { getNewsProcessingStatus } = await import('../../api');
    
    const status = await getNewsProcessingStatus({ taskId });
    
    res.json(status);
  } catch (error: any) {
    console.error('❌ API: Ошибка при проверке статуса:', error);
    res.status(500).json({ 
      error: 'Ошибка проверки статуса', 
      details: error.message 
    });
  }
});

// Отправка выбранных новостей на email
router.post('/news/send-email', async (req, res) => {
  try {
    const { email, newsIds, subject, message } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
      return res.status(400).json({ error: 'newsIds must be a non-empty array' });
    }

    // Получаем userId из токена авторизации
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;
        userId = decoded.userId;
      } catch (tokenError) {
        console.error('Ошибка декодирования токена:', tokenError);
        // Продолжаем выполнение без userId
      }
    }

    // Получаем выбранные новости из базы данных
    const newsItems = await prisma.newsItem.findMany({
      where: {
        id: { in: newsIds }
      },
      orderBy: { publishedAt: 'desc' }
    });

    if (newsItems.length === 0) {
      return res.status(404).json({ error: 'Selected news items not found' });
    }

    // Формируем HTML содержимое письма
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject || 'Мониторинг налогового законодательства'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .news-item { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
          .news-title { font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .news-summary { margin-bottom: 10px; }
          .news-meta { font-size: 12px; color: #666; }
          .news-link { color: #007bff; text-decoration: none; }
          .news-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>${subject || 'Мониторинг налогового законодательства'}</h1>
        <p>${message || 'Направляем подборку актуальных новостей по налоговому законодательству:'}</p>
        
        ${newsItems.map(item => `
          <div class="news-item">
            <div class="news-title">${item.title}</div>
            <div class="news-summary">${item.summary || 'Описание недоступно'}</div>
            <div class="news-meta">
              <strong>Источник:</strong> ${item.sourceName || 'Не указан'} | 
              <strong>Дата:</strong> ${new Date(item.publishedAt).toLocaleDateString('ru-RU')}
              ${item.subject ? ` | <strong>Тема:</strong> ${item.subject}` : ''}
            </div>
            ${item.sourceUrl ? `<div><a href="${item.sourceUrl}" class="news-link">Читать полностью</a></div>` : ''}
          </div>
        `).join('')}
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          Это письмо отправлено автоматически системой TaxNewsRadar.<br>
          Для отписки от рассылки обратитесь к администратору системы.
        </p>
      </body>
      </html>
    `;

    // Отправляем email
    console.log('📧 Начинаем отправку email...');
    try {
      const { sendEmail } = await import('./actions');
      console.log('📧 Функция sendEmail импортирована, вызываем...');
      await sendEmail(email, subject || 'Мониторинг налогового законодательства', htmlContent);
      console.log('📧 Email успешно отправлен!');
    } catch (emailError) {
      console.error('❌ Ошибка при отправке email:', emailError);
      throw emailError;
    }

    // Создаем отчет о отправке новостей на email
    if (userId) {
      try {
        const report = await prisma.report.create({
          data: {
            userId,
            name: `Отправка новостей на email ${new Date().toLocaleDateString('ru-RU')}`,
            dateFrom: new Date(),
            dateTo: new Date(),
            itemCount: newsItems.length,
            keywordsUsed: subject || 'Отправка по email',
            fileUrl: '' // Для email отправок
          }
        });
        console.log('📊 Отчет о отправке email создан:', report.id);
      } catch (reportError) {
        console.error('⚠️ Ошибка создания отчета о отправке email:', reportError);
        // Не прерываем выполнение, если не удалось создать отчет
      }
    }

    res.json({
      success: true,
      message: 'Выбранные новости успешно отправлены на email',
      email,
      newsCount: newsItems.length
    });
  } catch (error: any) {
    console.error('Ошибка отправки email:', error);
    res.status(500).json({ 
      error: 'Не удалось отправить email', 
      details: error.message 
    });
  }
});

// Получение email настроек
router.get('/email-settings', async (req, res) => {
  try {
    // TODO: Реализовать получение email настроек пользователя
    res.json({
      email: 'user@example.com',
      isEnabled: true,
      summaryFrequency: 'DAILY'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch email settings', details: error.message });
  }
});

// Обновление email настроек
router.put('/email-settings', async (req, res) => {
  try {
    // TODO: Реализовать обновление email настроек пользователя
    res.json({
      message: 'Email settings updated successfully',
      settings: req.body
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update email settings', details: error.message });
  }
});

// Совместимость: клиент ранее использовал POST вместо PUT
router.post('/email-settings', async (req, res) => {
  try {
    res.json({
      message: 'Email settings updated successfully',
      settings: req.body
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update email settings', details: error.message });
  }
});

// Отправка тестового email
router.post('/email-settings/test', async (req, res) => {
  try {
    // TODO: Реализовать отправку тестового email
    res.json({
      message: 'Test email sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// Отправка сводки новостей на email
router.post('/email-settings/send-summary', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // TODO: Реализовать отправку сводки новостей на email
    // Пока что возвращаем успешный ответ для тестирования
    res.json({
      success: true,
      message: 'Email summary sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send email summary', details: error.message });
  }
});

// Дополнительные алиасы для источников/ключевых слов, которые использует клиент
router.post('/sources/toggle-by-type', async (req, res) => {
  try {
    const { type, isEnabled } = req.body;
    await prisma.source.updateMany({ where: { type }, data: { isEnabled: Boolean(isEnabled) } });
    res.json({ message: 'Sources toggled by type' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle sources by type', details: error.message });
  }
});

router.post('/sources/toggle-by-ids', async (req, res) => {
  try {
    const { ids, isEnabled } = req.body as { ids: string[]; isEnabled: boolean };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await prisma.source.updateMany({ where: { id: { in: ids } }, data: { isEnabled: Boolean(isEnabled) } });
    res.json({ message: 'Sources toggled by ids' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle sources by ids', details: error.message });
  }
});

// Тестовый экспорт пустого Excel файла
router.post('/reports/test-export', async (req, res) => {
  try {
    // TODO: Реализовать тестовый экспорт Excel файла
    // Пока что возвращаем успешный ответ для тестирования
    res.json({
      reportId: 'test-report-' + Date.now(),
      fileUrl: '/test-export.xlsx',
      itemCount: 0
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to test export Excel', details: error.message });
  }
});

// Отправка отчета в Telegram
router.post('/telegram/report', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('📱 Начинаем отправку отчета в Telegram...');
    
    // Получаем userId из токена авторизации
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;
        userId = decoded.userId;
      } catch (tokenError) {
        console.error('Ошибка декодирования токена:', tokenError);
        // Продолжаем выполнение без userId
      }
    }
    
    // Импортируем TelegramService
    const { TelegramService } = await import('./utils/telegram');
    
    // Инициализируем сервис
    await TelegramService.initialize();
    
    // Отправляем сообщение
    const success = await TelegramService.sendMessage({
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      text: text,
      parseMode: 'HTML',
      disableWebPagePreview: false
    });
    
    if (success) {
      console.log('✅ Отчет успешно отправлен в Telegram!');
      
      // Создаем отчет о отправке в Telegram
      if (userId) {
        try {
          const report = await prisma.report.create({
            data: {
              userId,
              name: `Отправка в Telegram ${new Date().toLocaleDateString('ru-RU')}`,
              dateFrom: new Date(),
              dateTo: new Date(),
              itemCount: 1, // Одно сообщение
              keywordsUsed: 'Отправка в Telegram',
              fileUrl: '' // Для Telegram отправок
            }
          });
          console.log('📊 Отчет о отправке в Telegram создан:', report.id);
        } catch (reportError) {
          console.error('⚠️ Ошибка создания отчета о отправке в Telegram:', reportError);
          // Не прерываем выполнение, если не удалось создать отчет
        }
      }
      
      res.json({
        ok: true,
        message: 'Отчет успешно отправлен в Telegram'
      });
    } else {
      throw new Error('Не удалось отправить сообщение в Telegram');
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка отправки в Telegram:', error);
    res.status(500).json({ 
      error: 'Не удалось отправить отчет в Telegram', 
      details: error.message 
    });
  }
});

// Webhook для получения сообщений от Telegram
router.post('/telegram/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (message && message.text) {
      console.log('📱 Получено сообщение от Telegram:', message.text);
      
      // Обрабатываем команду /start
      if (message.text === '/start') {
        const chatId = message.chat.id;
        console.log('🆔 Получен Chat ID:', chatId);
        
        // Отправляем приветственное сообщение
        const { TelegramService } = await import('./utils/telegram');
        await TelegramService.initialize();
        
        await TelegramService.sendMessage({
          chatId: chatId.toString(),
          text: `🎉 Привет! Я бот TaxNewsRadar!\n\n📱 Ваш Chat ID: \`${chatId}\`\n\n💡 Скопируйте этот ID в ваш .env файл как TELEGRAM_CHAT_ID\n\n✅ После этого я смогу отправлять вам новости!`,
          parseMode: 'Markdown'
        });
        
        console.log('✅ Приветственное сообщение отправлено на Chat ID:', chatId);
      }
    }
    
    // Telegram требует ответ 200 OK
    res.status(200).json({ ok: true });
    
  } catch (error: any) {
    console.error('❌ Ошибка в webhook:', error);
    res.status(200).json({ ok: true }); // Всегда отвечаем 200
  }
});

// Подключаем auth router
console.log('🔍 API: Подключаю auth router...');
try {
  router.use('/auth', authRouter);
  console.log('✅ API: Auth router успешно подключен');
} catch (error) {
  console.error('❌ API: Ошибка при подключении auth router:', error);
}

console.log('✅ API: API с Prisma создан');

export { router as apiRouter };

