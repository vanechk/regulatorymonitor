import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseMinfin(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing Minfin: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });
    if (!response || !response.data) throw new Error('Нет данных от Минфина (response is undefined)');
    
    const $ = cheerio.load(response.data);
    const articles: ParsedArticle[] = [];
    
    const selectors = [
      '.news__item',
      '.news-item, .article-item, .content-item',
      'article, .article-wrapper, .news-wrapper',
      'div, p'
    ];
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        const title = $el.find('.news__title, .title, h1, h2, h3, .news-title').first().text().trim();
        const summary = $el.find('.news__text, .summary, .description, .text, p').first().text().trim();
        const link = $el.find('.news__title, a').first().attr('href');
        const dateText = $el.find('.news__date, .date, .time, .published').first().text().trim();
        let publishedDate = 'NO_DATE';
        const parsedDate = parseRussianDate(dateText);
        if (parsedDate) {
          const [day, month, year] = parsedDate.split('.');
          publishedDate = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
        }
        if (title && summary) {
          const fullUrl = link ? new URL(link, url).href : url;
          const textLower = (title + ' ' + summary).toLowerCase();
          const hasKeyword = keywords.length === 0 || keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
          if (hasKeyword) {
            articles.push({
              title,
              summary: summary.length > 500 ? summary.substring(0, 500) + '...' : summary,
              publishedDate,
              url: fullUrl,
              subject: 'Новости Минфина РФ',
              position: 'Официальная информация Министерства финансов'
            });
          }
        }
      });
      if (articles.length > 0) break;
    }
    
    console.log(`Found ${articles.length} articles from Minfin`);
    return { articles };
    
  } catch (error) {
    console.error('Error parsing Minfin:', error);
    return {
      articles: [],
      error: `Failed to parse Minfin: ${error instanceof Error ? error.message : 'Unknown error'}`
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