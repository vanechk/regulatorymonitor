const fetch = require('node-fetch');

async function testNewsLoading() {
  console.log('Тестирование загрузки новостей...');
  
  try {
    // Тест 1: Загрузка новостей без фильтров
    console.log('\n1. Загрузка новостей без фильтров...');
    const response1 = await fetch('http://localhost:3000/api/news/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: ['налог', 'фнс', 'налоговые']
      })
    });
    
    const result1 = await response1.json();
    console.log('Результат:', result1);
    
    // Ждем немного, чтобы задача завершилась
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Тест 2: Получение новостей из базы данных
    console.log('\n2. Получение новостей из базы данных...');
    const response2 = await fetch('http://localhost:3000/api/news');
    const news = await response2.json();
    
    console.log(`Найдено новостей: ${news.length}`);
    if (news.length > 0) {
      console.log('Первая новость:', {
        title: news[0].title,
        summary: news[0].summary?.substring(0, 100) + '...',
        publishedAt: news[0].publishedAt,
        sourceName: news[0].sourceName
      });
    }
    
    // Тест 3: Фильтрация по дате
    console.log('\n3. Фильтрация по дате...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const response3 = await fetch(`http://localhost:3000/api/news?dateFrom=${yesterday.toISOString().split('T')[0]}&dateTo=${today.toISOString().split('T')[0]}`);
    const filteredNews = await response3.json();
    
    console.log(`Новостей за последние 2 дня: ${filteredNews.length}`);
    
    // Тест 4: Фильтрация по ключевым словам
    console.log('\n4. Фильтрация по ключевым словам...');
    const response4 = await fetch('http://localhost:3000/api/news?keywords=налог,фнс');
    const keywordFilteredNews = await response4.json();
    
    console.log(`Новостей с ключевыми словами: ${keywordFilteredNews.length}`);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

testNewsLoading(); 