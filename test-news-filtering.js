const { PrismaClient } = require('@prisma/client');

async function testNewsFiltering() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing news loading and filtering...');
    
    // 1. Проверим, есть ли новости в базе данных
    const newsCount = await prisma.newsItem.count();
    console.log(`News count in database: ${newsCount}`);
    
    if (newsCount === 0) {
      console.log('No news found. Loading news via API...');
      
      // Загрузим новости через API
      const response = await fetch('http://localhost:3000/api/news/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: 'telegram',
          keywords: ['налог']
        }),
      });
      
      const result = await response.json();
      console.log('Fetch result:', result);
      
      // Подождем немного для обработки
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // 2. Получим все новости
    const allNews = await prisma.newsItem.findMany({
      include: { source: true },
      orderBy: { publishedAt: 'desc' }
    });
    
    console.log(`\nFound ${allNews.length} news items total`);
    
    // 3. Протестируем фильтрацию по ключевым словам
    console.log('\n=== Testing keyword filtering ===');
    
    const keywordTests = ['налог', 'НДС', 'ФНС', 'налоговые'];
    
    for (const keyword of keywordTests) {
      const filteredNews = allNews.filter(item => {
        const fullText = `${item.title} ${item.summary} ${item.subject || ''} ${item.position || ''}`.toLowerCase();
        return fullText.includes(keyword.toLowerCase());
      });
      
      console.log(`Keyword "${keyword}": ${filteredNews.length} news items`);
      filteredNews.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
      });
    }
    
    // 4. Протестируем фильтрацию по датам
    console.log('\n=== Testing date filtering ===');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayNews = allNews.filter(item => {
      const itemDate = new Date(item.publishedAt);
      return itemDate.toDateString() === today.toDateString();
    });
    
    const yesterdayNews = allNews.filter(item => {
      const itemDate = new Date(item.publishedAt);
      return itemDate.toDateString() === yesterday.toDateString();
    });
    
    const weekNews = allNews.filter(item => {
      const itemDate = new Date(item.publishedAt);
      return itemDate >= weekAgo;
    });
    
    console.log(`Today: ${todayNews.length} news items`);
    console.log(`Yesterday: ${yesterdayNews.length} news items`);
    console.log(`Last week: ${weekNews.length} news items`);
    
    // 5. Протестируем API фильтрации
    console.log('\n=== Testing API filtering ===');
    
    // Фильтр по ключевому слову
    const keywordResponse = await fetch('http://localhost:3000/api/news?keywords=налог');
    const keywordNews = await keywordResponse.json();
    console.log(`API keyword filter "налог": ${keywordNews.length} news items`);
    
    // Фильтр по дате
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);
    const dateResponse = await fetch(`http://localhost:3000/api/news?dateFrom=${dateFrom.toISOString()}`);
    const dateNews = await dateResponse.json();
    console.log(`API date filter (last 30 days): ${dateNews.length} news items`);
    
    // Комбинированный фильтр
    const combinedResponse = await fetch(`http://localhost:3000/api/news?keywords=налог&dateFrom=${dateFrom.toISOString()}`);
    const combinedNews = await combinedResponse.json();
    console.log(`API combined filter: ${combinedNews.length} news items`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewsFiltering(); 