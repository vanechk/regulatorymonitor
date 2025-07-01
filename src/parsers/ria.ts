import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseRIA(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing RIA News: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });
    if (!response || !response.data) throw new Error('Нет данных от РИА (response is undefined)');
    
    const $ = cheerio.load(response.data);
    const articles: ParsedArticle[] = [];
    
    // Расширенные селекторы для РИА Новости
    const selectors = [
      '.list-item, .list__item, .news-item, .item',
      '.article, .article-item, .content-item',
      '.card, .card-item, .news-card',
      '.story, .story-item, .news-story',
      'article, .article-wrapper, .news-wrapper'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Ищем заголовок
        let title = $el.find('.list-item__title, .item__title, .article-title, .title, h1, h2, h3, .news-title, .article-heading, .headline, .card-title').first().text().trim();
        
        // Ищем описание
        let summary = $el.find('.list-item__announce, .item__announce, .article-text, .text, .summary, .description, p, .article-announce, .excerpt, .lead, .card-text').first().text().trim();
        
        // Ищем ссылку
        let link = $el.find('.list-item__link, .item__link, a').first().attr('href');
        
        // Ищем дату
        let dateText = $el.find('.list-item__date, .item__date, .article-date, .date, .time, .published, .article-time, .timestamp').first().text().trim();
        const parsedDate = parseRussianDate(dateText);
        if (!parsedDate) return;
        const [day, month, year] = parsedDate.split('.');
        const publishedAt = new Date(`${year}-${month}-${day}T00:00:00Z`);
        
        if (title && summary) {
          const fullUrl = link ? new URL(link, url).href : url;
          
          // Фильтруем по ключевым словам
          const textLower = (title + ' ' + summary).toLowerCase();
          const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
            textLower.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword) {
            articles.push({
              title,
              summary: summary.length > 500 ? summary.substring(0, 500) + '...' : summary,
              publishedDate: publishedAt.toISOString(),
              url: fullUrl,
              subject: 'Новости РИА',
              position: 'РИА Новости'
            });
          }
        }
      });
      
      if (articles.length > 0) break; // Если нашли статьи, прекращаем поиск
    }
    
    // Если не нашли новости, пробуем искать в текстовых блоках
    if (articles.length === 0) {
      console.log('Trying alternative parsing method for RIA');
      
      $('div, p, article').each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        
        if (text && text.length > 100 && text.length < 2000) {
          const textLower = text.toLowerCase();
          const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
            textLower.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword) {
            const title = text.split('\n')[0].substring(0, 100).trim();
            const summary = text.length > 200 ? text.substring(0, 200) + '...' : text;
            
            articles.push({
              title,
              summary,
              publishedDate: new Date().toLocaleDateString('ru-RU'),
              url: url,
              subject: 'Новости РИА',
              position: 'РИА Новости'
            });
          }
        }
      });
    }
    
    console.log(`Found ${articles.length} articles from RIA News`);

    return { articles };
    
  } catch (error) {
    console.error('Error parsing RIA News:', error);

    return {
      articles: [],
      error: `Failed to parse RIA News: ${error instanceof Error ? error.message : 'Unknown error'}`
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