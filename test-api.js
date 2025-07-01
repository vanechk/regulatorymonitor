// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNewsAPI() {
  console.log('Тестирование API новостей...');
  
  try {
    // Тест 1: Получение новостей без фильтров
    console.log('\n1. Получение новостей без фильтров...');
    const response1 = await fetch('http://localhost:3000/api/news');
    const news1 = await response1.json();
    console.log(`Найдено новостей: ${news1.length}`);
    
    if (news1.length > 0) {
      console.log('Первая новость:', {
        title: news1[0].title,
        sourceName: news1[0].sourceName,
        publishedAt: news1[0].publishedAt
      });
    }
    
    // Тест 2: Фильтрация по дате
    console.log('\n2. Фильтрация по дате (последние 7 дней)...');
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);
    
    const response2 = await fetch(`http://localhost:3000/api/news?dateFrom=${dateFrom.toISOString()}`);
    const news2 = await response2.json();
    console.log(`Новостей за последние 7 дней: ${news2.length}`);
    
    // Тест 3: Фильтрация по ключевым словам
    console.log('\n3. Фильтрация по ключевым словам (налог)...');
    const response3 = await fetch('http://localhost:3000/api/news?keywords=налог');
    const news3 = await response3.json();
    console.log(`Новостей с ключевым словом "налог": ${news3.length}`);
    
    // Тест 4: Фильтрация по типу источника
    console.log('\n4. Фильтрация по типу источника (website)...');
    const response4 = await fetch('http://localhost:3000/api/news?sourceType=website');
    const news4 = await response4.json();
    console.log(`Новостей с веб-сайтов: ${news4.length}`);
    
    // Тест 5: Комбинированная фильтрация
    console.log('\n5. Комбинированная фильтрация...');
    const response5 = await fetch(`http://localhost:3000/api/news?dateFrom=${dateFrom.toISOString()}&keywords=налог&sourceType=website`);
    const news5 = await response5.json();
    console.log(`Новостей с комбинированными фильтрами: ${news5.length}`);
    
    // Тест 6: Загрузка новых новостей
    console.log('\n6. Загрузка новых новостей...');
    const response6 = await fetch('http://localhost:3000/api/news/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: ['налог', 'НДС', 'ФНС']
      })
    });
    const result6 = await response6.json();
    console.log('Результат загрузки:', result6);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

testNewsAPI(); 