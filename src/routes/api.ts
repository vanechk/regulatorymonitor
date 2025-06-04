import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получение списка источников
router.get('/sources', async (req, res) => {
  try {
    const sources = await prisma.source.findMany();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Создание источника
router.post('/sources', async (req, res) => {
  try {
    const source = await prisma.source.create({ data: req.body });
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create source', details: error.message });
  }
});

// Получение списка ключевых слов
router.get('/keywords', async (req, res) => {
  try {
    const keywords = await prisma.keyword.findMany();
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

// Создание ключевого слова
router.post('/keywords', async (req, res) => {
  try {
    const keyword = await prisma.keyword.create({ data: req.body });
    res.json(keyword);
  } catch (error) {
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
      where.source = { type: sourceType };
    }
    
    if (keywords) {
      const keywordArray = (keywords as string).split(',').map(k => k.trim());
      where.keywords = {
        some: {
          text: {
            in: keywordArray
          }
        }
      };
    }
    
    const news = await prisma.newsItem.findMany({
      where,
      include: {
        source: true,
        keywords: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create news', details: error.message });
  }
});

// Получение настроек email
router.get('/email-settings', async (req, res) => {
  try {
    const settings = await prisma.emailSettings.findFirst();
    res.json(settings || { email: '', isEnabled: false, summaryFrequency: 'DAILY' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

export { router as apiRouter }; 