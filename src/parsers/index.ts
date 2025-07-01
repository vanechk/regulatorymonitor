import { parseMinfin } from './minfin';
import { parseFNS } from './fns';
import { parseConsultantPlus } from './consultant-plus';
import { parseRIA } from './ria';
import { parseVedomosti } from './vedomosti';
import { parseTelegramChannel } from './telegram';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface ParsedArticle {
  title: string;
  summary: string;
  publishedDate: string;
  url: string;
  documentRef?: string;
  taxType?: string;
  subject?: string;
  position?: string;
}

export interface ParserResult {
  articles: ParsedArticle[];
  error?: string;
}

// Централизованный маппинг ключевых слов на парсеры

const parserMapping = [
  { keywords: ['minfin', 'минфин'], parser: parseMinfin },
  { keywords: ['nalog.ru', 'фнс'], parser: parseFNS },
  { keywords: ['consultant', 'консультант'], parser: parseConsultantPlus },
  { keywords: ['ria.ru', 'риа'], parser: parseRIA },
  { keywords: ['vedomosti', 'ведомости'], parser: parseVedomosti },
  { keywords: ['t.me', 'telegram'], parser: parseTelegramChannel },
];

// Функция для выбора парсера на основе имени и URL источника
export function getParserForSource(source: { name: string; url: string }): (url: string, keywords: string[]) => Promise<ParserResult> {
  const sourceText = `${source.name.toLowerCase()} ${source.url.toLowerCase()}`;

  for (const mapping of parserMapping) {
    if (mapping.keywords.some(keyword => sourceText.includes(keyword))) {
      console.log(`Using parser for source: ${source.name} based on keyword '${mapping.keywords[0]}'`);
      return mapping.parser;
    }
  }

  console.log(`Using universal parser for source: ${source.name}`);
  return (url, keywords) => parseUniversal(url, keywords, source.name);
}

// Универсальный парсер для источников без специальных парсеров
export async function parseUniversal(url: string, keywords: string[], sourceName: string): Promise<ParserResult> {
  try {
    console.log(`Parsing universal source: ${sourceName} (${url})`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 20000
    });
    
    const $ = cheerio.load(response.data);
    const articles: ParsedArticle[] = [];
    
    // Универсальные селекторы для различных сайтов
    const selectors = [
      '.news-item, .news__item, .item, .list-item, .article-item',
      '.article, .content-item, .post, .entry',
      '.card, .card-item, .news-card, .content-card',
      '.story, .story-item, .news-story',
      'article, .article-wrapper, .news-wrapper, .content-wrapper'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        let title = $el.find('.title, .headline, .article-title, .news-title, h1, h2, h3, .card-title, .item-title').first().text().trim();
        let summary = $el.find('.text, .summary, .description, .excerpt, .lead, .announce, p, .article-text, .news-text, .card-text').first().text().trim();
        let link = $el.find('a').first().attr('href');
        let dateText = $el.find('.date, .time, .published, .timestamp, .article-date, .news-date').first().text().trim();
        
        if (title && summary) {
          const fullUrl = link ? new URL(link, url).href : url;
          const publishedDate = parseRussianDate(dateText) || new Date().toISOString();
          
          articles.push({
            title,
            summary: summary.length > 500 ? summary.substring(0, 497) + '...' : summary,
            publishedDate,
            url: fullUrl,
            subject: `Новости ${sourceName}`,
            position: sourceName
          });
        }
      });
      
      if (articles.length > 0) break;
    }
    
    console.log(`Found ${articles.length} articles from ${sourceName}`);
    
    return { articles };
    
  } catch (error) {
    console.error(`Error parsing ${sourceName}:`, error);
    return {
      articles: [],
      error: `Failed to parse ${sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function parseRussianDate(dateText: string): string | null {
  if (!dateText) return null;
  try {
    const today = new Date();
    if (dateText.includes('сегодня')) return today.toISOString();
    if (dateText.includes('вчера')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    }
    const dateMatch = dateText.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
    }
    return new Date(dateText).toISOString();
  } catch (e) {
    console.error(`Could not parse date: ${dateText}`);
    return null;
  }
}

// Функция для фильтрации статей по ключевым словам
export function filterArticlesByKeywords(articles: ParsedArticle[], keywords: string[]): ParsedArticle[] {
  if (!keywords || keywords.length === 0) {
    return articles;
  }
  
  return articles.filter(article => {
    const fullText = `${article.title} ${article.summary} ${article.subject || ''} ${article.position || ''}`.toLowerCase();
    return keywords.some(keyword => fullText.includes(keyword.toLowerCase()));
  });
}

// Функция для выбора подходящего парсера на основе URL или названия источника
export async function requestModel(url: string, keywords: string[], sourceName: string): Promise<ParserResult> {
  const urlLower = url.toLowerCase();
  const sourceNameLower = sourceName.toLowerCase();
  
  // Определяем тип источника и выбираем соответствующий парсер
  if (urlLower.includes('minfin') || sourceNameLower.includes('минфин')) {
    return await parseMinfin(url, keywords);
  } else if (urlLower.includes('nalog.gov.ru') || urlLower.includes('fns') || sourceNameLower.includes('фнс')) {
    return await parseFNS(url, keywords);
  } else if (urlLower.includes('consultant.ru') || sourceNameLower.includes('консультант')) {
    return await parseConsultantPlus(url, keywords);
  } else if (urlLower.includes('ria.ru') || sourceNameLower.includes('риа')) {
    return await parseRIA(url, keywords);
  } else if (urlLower.includes('vedomosti.ru') || sourceNameLower.includes('ведомости')) {
    return await parseVedomosti(url, keywords);
  } else if (urlLower.includes('t.me') || urlLower.includes('telegram') || sourceNameLower.includes('telegram')) {
    return await parseTelegramChannel(url, keywords);
  } else {
    // Для всех остальных источников используем универсальный парсер
    return await parseUniversal(url, keywords, sourceName);
  }
}

// Универсальная retry-обёртка для axios.get
export async function fetchWithRetry(url: string, options: AxiosRequestConfig = {}, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (err) {
      const e = err as any;
      // Сетевые ошибки, которые не должны падать наружу, а только логироваться
      if (e && (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || e.code === 'ENOTFOUND')) {
        console.warn(`[fetchWithRetry] Сетевая ошибка (${e.code}) при запросе к ${url} (попытка ${i+1}/${retries}): ${e.message}`);
        if (i === retries - 1) return undefined;
      } else {
        // Другие ошибки логируем как error и выбрасываем на последней попытке
        console.error(`[fetchWithRetry] Ошибка при запросе к ${url}:`, e);
        if (i === retries - 1) throw e;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
} 