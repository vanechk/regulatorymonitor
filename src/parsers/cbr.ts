import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParserResult, ParsedArticle, fetchWithRetry } from './index';

export async function parseCBR(url: string, keywords: string[]): Promise<ParserResult> {
  try {
    console.log(`Parsing CBR: ${url}`);
    
    // RSS каналы ЦБ РФ
    const rssChannels = [
      'http://www.cbr.ru/rss/RssNews',      // Новое на сайте
      'http://www.cbr.ru/rss/eventrss',     // Новости, интервью, выступления
      'http://www.cbr.ru/rss/RssPress',     // Пресс-релизы
      'http://www.cbr.ru/rss/RssCurrency'   // Курсы валют
    ];
    
    const allArticles: ParsedArticle[] = [];
    
    // Парсим каждый RSS канал
    for (const rssUrl of rssChannels) {
      try {
        console.log(`Parsing RSS channel: ${rssUrl}`);
        
        const response = await axios.get(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
          },
          timeout: 20000
        });

        if (!response || !response.data) {
          console.log(`No data from RSS channel: ${rssUrl}`);
          continue;
        }

        const $ = cheerio.load(response.data, { xmlMode: true });
        const items = $('item');
        
        console.log(`Found ${items.length} items in ${rssUrl}`);
        
        items.each((index, element) => {
          const $el = $(element);
          
          // Извлекаем данные из RSS
          const title = $el.find('title').text().trim();
          const description = $el.find('description').text().trim();
          const link = $el.find('link').text().trim();
          const pubDate = $el.find('pubDate').text().trim();
          
          if (title && description) {
            // Фильтруем по ключевым словам
            const textLower = (title + ' ' + description).toLowerCase();
            const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
              textLower.includes(keyword.toLowerCase())
            );
            
            if (hasKeyword) {
              // Определяем тип контента по URL
              let subject = 'Новости ЦБ РФ';
              let position = 'Центральный банк Российской Федерации';
              
              if (rssUrl.includes('RssPress')) {
                subject = 'Пресс-релизы ЦБ РФ';
              } else if (rssUrl.includes('RssCurrency')) {
                subject = 'Курсы валют ЦБ РФ';
              } else if (rssUrl.includes('eventrss')) {
                subject = 'События ЦБ РФ';
              }
              
              const publishedDate = parseRSSDate(pubDate) || new Date().toISOString();
              const fullUrl = link || url;
              
              allArticles.push({
                title,
                summary: description.length > 500 ? description.substring(0, 500) + '...' : description,
                publishedDate,
                url: fullUrl,
                subject,
                position
              });
            }
          }
        });
        
      } catch (error) {
        console.error(`Error parsing RSS channel ${rssUrl}:`, error);
        continue;
      }
    }
    
    // Если RSS не дал результатов, пробуем парсить HTML страницу
    if (allArticles.length === 0) {
      console.log('RSS channels failed, trying HTML parsing...');
      
      try {
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

        if (response && response.data) {
          const $ = cheerio.load(response.data);
          
          // Селекторы для новостей ЦБ РФ
          const selectors = [
            '.news-item, .news__item, .item, .list-item',
            '.article, .article-item, .content-item',
            '.card, .card-item, .news-card',
            '.press-release, .press-item, .release-item',
            'article, .article-wrapper, .news-wrapper'
          ];
          
          for (const selector of selectors) {
            $(selector).each((index, element) => {
              const $el = $(element);
              
              // Ищем заголовок
              let title = $el.find('.news-item__title, .item__title, .article-title, .title, h1, h2, h3, .news-title, .article-heading, .headline, .card-title, .press-title').first().text().trim();
              
              // Ищем описание
              let summary = $el.find('.news-item__text, .item__text, .article-text, .text, .summary, .description, p, .article-announce, .excerpt, .lead, .card-text, .press-text').first().text().trim();
              
              // Ищем ссылку
              let link = $el.find('.news-item__link, .item__link, a').first().attr('href');
              
              // Ищем дату
              let dateText = $el.find('.news-item__date, .item__date, .article-date, .date, .time, .published, .article-time, .timestamp, .press-date').first().text().trim();
              
              if (title && summary) {
                const fullUrl = link ? new URL(link, url).href : url;
                const publishedDate = parseRussianDate(dateText) || new Date().toISOString();
                
                // Фильтруем по ключевым словам
                const textLower = (title + ' ' + summary).toLowerCase();
                const hasKeyword = keywords.length === 0 || keywords.some(keyword => 
                  textLower.includes(keyword.toLowerCase())
                );
                
                if (hasKeyword) {
                  allArticles.push({
                    title,
                    summary: summary.length > 500 ? summary.substring(0, 500) + '...' : summary,
                    publishedDate,
                    url: fullUrl,
                    subject: 'Новости ЦБ РФ',
                    position: 'Центральный банк Российской Федерации'
                  });
                }
              }
            });
            
            if (allArticles.length > 0) break; // Если нашли статьи, прекращаем поиск
          }
        }
      } catch (error) {
        console.error('Error parsing HTML:', error);
      }
    }
    
    console.log(`Total articles found: ${allArticles.length}`);
    
    return { articles: allArticles };
    
  } catch (error) {
    console.error(`Error parsing CBR:`, error);
    return {
      articles: [],
      error: `Failed to parse CBR: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Функция для парсинга RSS дат
function parseRSSDate(dateText: string): string | null {
  if (!dateText) return null;
  
  try {
    // RSS даты обычно в формате RFC 822
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Попытка парсинга других форматов
    return new Date(dateText).toISOString();
    
  } catch (e) {
    console.error(`Could not parse RSS date: ${dateText}`);
    return null;
  }
}

// Функция для парсинга русских дат
function parseRussianDate(dateText: string): string | null {
  if (!dateText) return null;
  
  try {
    const today = new Date();
    
    // Обработка относительных дат
    if (dateText.includes('сегодня')) return today.toISOString();
    if (dateText.includes('вчера')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString();
    }
    
    // Обработка формата DD.MM.YYYY
    const dateMatch = dateText.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
    }
    
    // Обработка формата DD.MM.YY
    const shortDateMatch = dateText.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2})/);
    if (shortDateMatch) {
      const day = shortDateMatch[1].padStart(2, '0');
      const month = shortDateMatch[2].padStart(2, '0');
      const year = '20' + shortDateMatch[3];
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
    }
    
    // Обработка текстовых дат
    const monthNames: { [key: string]: number } = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
      'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };
    
    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      if (dateText.includes(monthName)) {
        const yearMatch = dateText.match(/(\d{4})/);
        const dayMatch = dateText.match(/(\d{1,2})/);
        
        if (yearMatch && dayMatch) {
          const year = parseInt(yearMatch[1]);
          const day = parseInt(dayMatch[1]);
          const month = monthIndex;
          
          return new Date(year, month, day).toISOString();
        }
      }
    }
    
    // Попытка прямого парсинга
    return new Date(dateText).toISOString();
    
  } catch (e) {
    console.error(`Could not parse date: ${dateText}`);
    return null;
  }
}
