import express from 'express';
import { db } from './db';
import { 
  type Source, 
  type Keyword, 
  type NewsItem, 
  type Report, 
  type EmailSettings 
} from '../types/api';
// import educationIcon from '../../..//education.png';
// import searchIcon from '../../..//search.png';

const router = express.Router();

// Источники
router.get('/sources', async (req, res) => {
  try {
    const sources = await db.source.findMany();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении источников' });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const { name, url, type } = req.body;
    const source = await db.source.create({
      data: { name, url, type, isEnabled: true }
    });
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании источника' });
  }
});

router.post('/sources/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;
    const source = await db.source.update({
      where: { id },
      data: { isEnabled }
    });
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении источника' });
  }
});

router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.source.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении источника' });
  }
});

// Ключевые слова
router.get('/keywords', async (req, res) => {
  try {
    const keywords = await db.keyword.findMany();
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении ключевых слов' });
  }
});

router.post('/keywords', async (req, res) => {
  try {
    const { text } = req.body;
    const keyword = await db.keyword.create({
      data: { text }
    });
    res.json(keyword);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании ключевого слова' });
  }
});

router.delete('/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.keyword.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении ключевого слова' });
  }
});

// Новости
router.get('/news', async (req, res) => {
  try {
    const { dateFrom, dateTo, keywords, sourceType } = req.query;
    console.log('News query params:', { dateFrom, dateTo, keywords, sourceType });
    
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) where.publishedAt.gte = new Date(dateFrom as string);
      if (dateTo) where.publishedAt.lte = new Date(dateTo as string);
    }
    
    if (sourceType) {
      where.source = { type: sourceType };
    }
    
    if (keywords) {
      const keywordArray = (keywords as string).split(',').map(k => k.trim()).filter(k => k.length > 0);
      if (keywordArray.length > 0) {
      where.OR = keywordArray.map((keyword: string) => ({
        OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { summary: { contains: keyword, mode: 'insensitive' } }
        ]
      }));
    }
    }
    
    console.log('Where condition:', JSON.stringify(where, null, 2));
    
    const news = await db.newsItem.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: 'desc' }
    });
    
    console.log(`Found ${news.length} news items`);
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Ошибка при получении новостей' });
  }
});

// Загрузка новостей
router.post('/news/fetch', async (req, res) => {
  try {
    const { sourceType, keywords } = req.body;
    console.log('Fetch news request:', { sourceType, keywords });
    
    // Импортируем функцию из основного API файла
    const { fetchAndProcessNews } = await import('../../api');
    
    const result = await fetchAndProcessNews({
      sourceType,
      keywords
    });
    
    console.log('Fetch result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Ошибка при загрузке новостей' });
  }
});

// Отчеты
router.get('/reports', async (req, res) => {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отчетов' });
  }
});

// Настройки email
router.get('/email-settings', async (req, res) => {
  try {
    const settings = await db.emailSettings.findFirst();
    res.json(settings || { email: '', isEnabled: false, summaryFrequency: 'DAILY' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении настроек email' });
  }
});

router.post('/email-settings', async (req, res) => {
  try {
    const { email, isEnabled, summaryFrequency } = req.body;
    const settings = await db.emailSettings.upsert({
      where: { id: '1' },
      update: { email, isEnabled, summaryFrequency },
      create: { id: '1', email, isEnabled, summaryFrequency }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении настроек email' });
  }
});

export { router as apiRouter };

