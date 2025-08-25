import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseConsultantPlus(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing ConsultantPlus: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response || !response.data) throw new Error('Нет данных от КонсультантПлюс (response is undefined)');
    
    const $ = cheerio.load(response.data);
    const articles: ParsedArticle[] = [];
    
    // Новый селектор для новостей КонсультантПлюс
    $('.b-news__item').each((index, element) => {
      const $el = $(element);
      const title = $el.find('.b-news__title').text().trim();
      const summary = $el.find('.b-news__text').text().trim();
      const link = $el.find('.b-news__title a').attr('href');
      const dateText = $el.find('.b-news__date').text().trim();
      const parsedDate = parseRussianDate(dateText);
      if (!parsedDate) return;
      const [day, month, year] = parsedDate.split('.');
      const publishedAt = new Date(`${year}-${month}-${day}T00:00:00Z`);
      if (title && summary) {
        const fullUrl = link ? new URL(link, url).href : url;
        articles.push({
          title,
          summary: summary.length > 500 ? summary.substring(0, 500) + '...' : summary,
          publishedDate: publishedAt.toISOString(),
          url: fullUrl,
          subject: 'Новости КонсультантПлюс',
          position: 'Аналитическая информация от КонсультантПлюс'
        });
      }
    });
    
    // Если не нашли новости, пробуем альтернативные селекторы
    if (articles.length === 0) {
      $('.news-item, .article-item, .content-item, .news-block, .news-list-item').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.title, h1, h2, h3, .news-title, .article-title, .news-heading').first().text().trim();
        const summary = $el.find('.summary, .description, .text, p, .news-text, .news-announce').first().text().trim();
        const link = $el.find('a').first().attr('href');
        const dateText = $el.find('.news-date, .date, .published, .article-date, .timestamp').first().text().trim();
        const parsedDate = parseRussianDate(dateText);
        let publishedDate = 'NO_DATE';
        if (parsedDate) {
        const [day, month, year] = parsedDate.split('.');
          publishedDate = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
        }
        if (title && summary) {
          const fullUrl = link ? new URL(link, url).href : url;
          articles.push({
            title,
            summary: summary.length > 500 ? summary.substring(0, 500) + '...' : summary,
            publishedDate,
            url: fullUrl,
            subject: 'Новости КонсультантПлюс',
            position: 'Аналитическая информация от КонсультантПлюс'
          });
        }
      });
    }
    
    console.log(`Found ${articles.length} articles from ConsultantPlus`);
    return { articles };
    
  } catch (error) {
    console.error('Error parsing ConsultantPlus:', error);
    return {
      articles: [],
      error: `Failed to parse ConsultantPlus: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function parseRussianDate(dateText: string): string | null {
  if (!dateText) return null;
  try {
    const today = new Date();
    if (dateText.includes('сегодня')) return today.toLocaleDateString('ru-RU');
    if (dateText.includes('вчера')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString('ru-RU');
    }
    const dateMatch = dateText.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
    const monthNames = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    for (let i = 0; i < monthNames.length; i++) {
      const monthName = monthNames[i];
      const regex = new RegExp(`(\\d{1,2})\\s+${monthName}\\s+(\\d{4})`, 'i');
      const match = dateText.match(regex);
      if (match) {
        const [, day, year] = match;
        const month = (i + 1).toString().padStart(2, '0');
        return `${day.padStart(2, '0')}.${month}.${year}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateText, error);
    return null;
  }
} 