import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseTelegramChannel(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing Telegram channel: ${url}`);
    let channelName = '';
    if (url.includes('t.me/')) {
      channelName = url.split('t.me/')[1]?.split('/')[0] || '';
    } else if (url.includes('@')) {
      channelName = url.split('@')[1]?.split('/')[0] || '';
    }
    if (!channelName) {
      return { articles: [], error: 'Invalid Telegram URL format' };
    }
    const webUrl = `https://t.me/s/${channelName}`;
    const response = await fetchWithRetry(webUrl, {
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
    if (!response || !response.data) {
      throw new Error('Нет данных от Telegram (response is undefined)');
    }
    const $ = cheerio.load(response.data);
    const articles: ParsedArticle[] = [];
    const selectors = [
      '.tgme_widget_message, .message, .post',
      'article, .article-wrapper, .news-wrapper',
      'div, p'
    ];
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        let text = $el.find('.tgme_widget_message_text, .message-text, .post-text, .text').text().trim();
        if (!text) {
          text = $el.find('p, .content, .body').text().trim();
        }
        let title = text.split('\n')[0].substring(0, 100).trim();
        let summary = text.length > 500 ? text.substring(0, 500) + '...' : text;
        let dateAttr = $el.find('time').attr('datetime') || $el.find('.date, .time, .timestamp').attr('datetime');
        let publishedDate = 'NO_DATE';
        if (dateAttr) {
          try {
            const date = new Date(dateAttr);
            publishedDate = date.toISOString();
          } catch (error) {
            // оставляем NO_DATE
          }
        }
        let link = $el.find('.tgme_widget_message_date, .message-date, .post-date').attr('href') || $el.find('a[href*="/s/"]').attr('href');
        let fullUrl = url;
        if (link) {
          if (link.startsWith('/')) {
            fullUrl = `https://t.me${link}`;
          } else if (link.startsWith('http')) {
            fullUrl = link;
          } else {
            fullUrl = `https://t.me/${channelName}/${link}`;
          }
        }
        if (text && text.length > 10) {
          const textLower = text.toLowerCase();
          const hasKeyword = keywords.length === 0 || keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
          if (hasKeyword) {
            articles.push({
              title,
              summary,
              publishedDate,
              url: fullUrl,
              subject: `Сообщения из Telegram-канала ${channelName}`,
              position: `Информация из Telegram-канала ${channelName}`
            });
          }
        }
      });
      if (articles.length > 0) break;
    }
    return { articles };
  } catch (error) {
    console.error('Error parsing Telegram channel:', error);
    return { articles: [], error: `Failed to parse Telegram channel: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Альтернативный метод парсинга через API (требует настройки)
export async function parseTelegramChannelAPI(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing Telegram channel via API: ${url}`);
    
    // Здесь можно добавить интеграцию с Telegram API
    // Для этого потребуется:
    // 1. Создать Telegram-приложение
    // 2. Получить API ID и Hash
    // 3. Использовать библиотеку типа gramjs или telethon
    
    // Пока возвращаем пустой результат
    return {
      articles: [],
      error: 'Telegram API integration not implemented yet'
    };
    
  } catch (error) {
    console.error('Error parsing Telegram channel via API:', error);
    return {
      articles: [],
      error: `Failed to parse Telegram channel via API: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 