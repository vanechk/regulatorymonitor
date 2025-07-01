import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseTelegramChannel(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing Telegram channel: ${url}`);
    
    // Извлекаем имя канала из URL
    let channelName = '';
    if (url.includes('t.me/')) {
      channelName = url.split('t.me/')[1]?.split('/')[0] || '';
    } else if (url.includes('@')) {
      channelName = url.split('@')[1]?.split('/')[0] || '';
    }
    
    if (!channelName) {
      return {
        articles: [],
        error: 'Invalid Telegram URL format'
      };
    }
    
    // Используем web-версию Telegram для парсинга
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
    
    // Улучшенные селекторы для Telegram-каналов
    $('.tgme_widget_message, .message, .post').each((index, element) => {
      const $el = $(element);
      
      // Ищем текст сообщения в разных возможных местах
      let text = $el.find('.tgme_widget_message_text, .message-text, .post-text, .text').text().trim();
      
      // Если не нашли, ищем в других селекторах
      if (!text) {
        text = $el.find('p, .content, .body').text().trim();
      }
      
      // Ищем дату
      let dateAttr = $el.find('time').attr('datetime');
      if (!dateAttr) {
        dateAttr = $el.find('.date, .time, .timestamp').attr('datetime');
      }
      
      // Ищем ссылку на сообщение
      let link = $el.find('.tgme_widget_message_date, .message-date, .post-date').attr('href');
      if (!link) {
        link = $el.find('a[href*="/s/"]').attr('href');
      }
      
      if (text && text.length > 10) {
        // Фильтруем по ключевым словам
        const textLower = text.toLowerCase();
        const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
          textLower.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword) {
          // Создаем заголовок из первых слов текста
          const title = text.split('\n')[0].substring(0, 100).trim();
          const summary = text.length > 500 ? text.substring(0, 500) + '...' : text;
          
          // Парсим дату
          let publishedDate = new Date().toLocaleDateString('ru-RU');
          if (dateAttr) {
            try {
              const date = new Date(dateAttr);
              publishedDate = date.toLocaleDateString('ru-RU');
            } catch (error) {
              console.error('Error parsing Telegram date:', error);
            }
          }
          
          // Формируем полную ссылку на сообщение
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
    
    // Если не нашли сообщения, пробуем альтернативный подход
    if (articles.length === 0) {
      console.log('Trying alternative parsing method for Telegram');
      
      // Ищем любые текстовые блоки
      $('div, p, article').each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        
        if (text && text.length > 50 && text.length < 2000) {
          const textLower = text.toLowerCase();
          const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
            textLower.includes(keyword.toLowerCase())
          );
          
          if (hasKeyword) {
            const title = text.split('\n')[0].substring(0, 100).trim();
            const summary = text.length > 500 ? text.substring(0, 500) + '...' : text;
            
            articles.push({
              title,
              summary,
              publishedDate: new Date().toLocaleDateString('ru-RU'),
              url: url,
              subject: `Сообщения из Telegram-канала ${channelName}`,
              position: `Информация из Telegram-канала ${channelName}`
            });
          }
        }
      });
    }
    
    console.log(`Found ${articles.length} messages from Telegram channel ${channelName}`);
    return { articles };
    
  } catch (error) {
    console.error('Error parsing Telegram channel:', error);

    // Если не удалось получить данные, создаем тестовые данные для демонстрации
    if (keywords.length > 0) {
      // Test data creation removed
    }

    return {
      articles: [],
      error: `Failed to parse Telegram channel: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
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