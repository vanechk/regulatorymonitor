import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchAndProcessNews, sendSelectedNewsEmail } from '../../api';

const router = Router();
const prisma = new PrismaClient();

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
    const keyword = await prisma.keyword.create({ data: req.body });
    res.json(keyword);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create keyword', details: error.message });
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
    
    // Фильтруем по ключевым словам в тексте, если указаны
    if (keywords) {
      const keywordArray = (keywords as string).split(',').map(k => k.trim());
      news = news.filter((item) => {
        const fullText = `${item.title} ${item.summary} ${item.subject || ''} ${item.position || ''}`.toLowerCase();
        return keywordArray.some((keyword) => fullText.includes(keyword.toLowerCase()));
      });
    }
    
    res.json(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
});

// Создание новости
router.post('/news', async (req, res) => {
  try {
    const { keywords, ...newsData } = req.body;
    const created = await prisma.newsItem.create({
      data: {
        ...newsData,
        keywords: keywords && keywords.length > 0 ? {
          connect: keywords.map((id: string) => ({ id }))
        } : undefined
      },
      include: { keywords: true, source: true }
    });
    res.json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create news', details: error.message });
  }
});

// Получение настроек email
router.get('/email-settings', async (req, res) => {
  try {
    const settings = await prisma.emailSettings.findFirst();
    res.json(settings || { email: '', isEnabled: false, summaryFrequency: 'DAILY' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// Загрузка новостей
router.post('/news/fetch', async (req, res) => {
  try {
    const { sourceType, keywords } = req.body;
    console.log('Fetch news request:', { sourceType, keywords });
    
    const result = await fetchAndProcessNews({
      sourceType,
      keywords
    });
    
    console.log('Fetch result:', result);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Ошибка при загрузке новостей' });
  }
});

// Отправка выбранных новостей на email
router.post('/news/send-email', async (req, res) => {
  try {
    const { email, newsIds, subject, message } = req.body;
    
    if (!email || !newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
      return res.status(400).json({ 
        error: 'Необходимо указать email и массив ID новостей для отправки' 
      });
    }

    const result = await sendSelectedNewsEmail({
      email,
      newsIds,
      subject,
      message
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error sending selected news email:', error);
    res.status(500).json({ 
      error: 'Ошибка при отправке email', 
      details: error.message 
    });
  }
});

// Получение статуса обработки новостей
router.get('/news/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Простая реализация статуса - в реальном приложении здесь была бы проверка статуса задачи
    // Пока возвращаем "completed" для всех задач
    res.json({ status: 'completed' });
  } catch (error: any) {
    console.error('Error getting task status:', error);
    res.status(500).json({ 
      error: 'Ошибка при получении статуса задачи', 
      details: error.message 
    });
  }
});

// Отправка отчёта в Telegram
router.post('/telegram/report', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Не передан текст отчёта' });
    }
    // Здесь должна быть интеграция с Telegram Bot API
    console.log('Отправка отчёта в Telegram:', text);
    // TODO: отправить text через Telegram Bot API
    res.json({ ok: true, message: 'Отчёт отправлен (заглушка)' });
  } catch (error: any) {
    console.error('Ошибка при отправке в Telegram:', error);
    res.status(500).json({ error: 'Ошибка при отправке в Telegram', details: error.message });
  }
});

export { router as apiRouter }; 