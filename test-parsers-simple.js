const axios = require('axios');
const cheerio = require('cheerio');

async function testRIAParser() {
  console.log('Тестирование парсера РИА Новости...\n');
  
  try {
    const url = 'https://ria.ru/';
    console.log(`URL: ${url}`);
    
    const startTime = Date.now();
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Парсим новости с сайта РИА Новости
    $('.list-item, .article-item, .content-item, .news-item, .list__item').each((index, element) => {
      const $el = $(element);
      
      const title = $el.find('.list-item__title, .article-title, h1, h2, h3, .title, .list__item-title').first().text().trim();
      const summary = $el.find('.list-item__text, .article-text, .summary, .description, p, .list__item-text').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const dateText = $el.find('.list-item__date, .article-date, .date, .time, .list__item-date').first().text().trim();
      
      if (title && summary) {
        const fullUrl = link ? new URL(link, url).href : url;
        
        articles.push({
          title,
          summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
          publishedDate: dateText || new Date().toLocaleDateString('ru-RU'),
          url: fullUrl,
          subject: 'Новости РИА Новости',
          position: 'Информационное агентство РИА Новости'
        });
      }
    });
    
    // Если не нашли новости в стандартных селекторах, пробуем альтернативные
    if (articles.length === 0) {
      $('article, .news, .content, .list li, .news-list li').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('h1, h2, h3, h4, .title, a, .news-title').first().text().trim();
        const summary = $el.find('p, .text, .description, .news-text, .announce').first().text().trim();
        const link = $el.find('a').first().attr('href');
        
        if (title && summary) {
          const fullUrl = link ? new URL(link, url).href : url;
          
          articles.push({
            title,
            summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
            publishedDate: new Date().toLocaleDateString('ru-RU'),
            url: fullUrl,
            subject: 'Новости РИА Новости',
            position: 'Информационное агентство РИА Новости'
          });
        }
      });
    }
    
    const endTime = Date.now();
    
    console.log(`Время выполнения: ${endTime - startTime}ms`);
    console.log(`✅ Найдено статей: ${articles.length}`);
    
    if (articles.length > 0) {
      console.log('\nПервые 3 статьи:');
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   Дата: ${article.publishedDate}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Краткое описание: ${article.summary.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ Статьи не найдены');
      console.log('Попробуем найти любые элементы с текстом...');
      
      // Показываем все найденные заголовки для отладки
      const allTitles = [];
      $('h1, h2, h3, h4, .title, .news-title, a').each((index, element) => {
        const title = $(element).text().trim();
        if (title && title.length > 10 && title.length < 200) {
          allTitles.push(title);
        }
      });
      
      console.log(`\nНайдено заголовков: ${allTitles.length}`);
      allTitles.slice(0, 10).forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

// Запускаем тест
testRIAParser().catch(console.error); 