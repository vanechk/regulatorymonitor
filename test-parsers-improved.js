const { requestModel } = require('./src/parsers/index.ts');

async function testImprovedParsers() {
  console.log('Тестирование улучшенных парсеров...\n');
  
  const testSources = [
    {
      name: 'Telegram канал',
      url: 'https://t.me/s/b1_tax',
      keywords: ['налог', 'фнс']
    },
    {
      name: 'Ведомости',
      url: 'https://www.vedomosti.ru/tax',
      keywords: ['налог', 'фнс']
    },
    {
      name: 'РИА Новости',
      url: 'https://ria.ru/tag_nalogi/',
      keywords: ['налог', 'фнс']
    },
    {
      name: 'ФНС',
      url: 'https://www.nalog.gov.ru/rn77/news/',
      keywords: ['налог', 'фнс']
    },
    {
      name: 'Универсальный источник',
      url: 'https://www.rbc.ru/economics/',
      keywords: ['налог', 'фнс']
    }
  ];
  
  for (const source of testSources) {
    console.log(`\n=== Тестирование ${source.name} ===`);
    console.log(`URL: ${source.url}`);
    console.log(`Ключевые слова: ${source.keywords.join(', ')}`);
    
    try {
      const result = await requestModel(source.url, source.keywords, source.name);
      
      if (result.error) {
        console.log(`❌ Ошибка: ${result.error}`);
      } else {
        console.log(`✅ Найдено статей: ${result.articles.length}`);
        
        if (result.articles.length > 0) {
          console.log('\nПримеры статей:');
          result.articles.slice(0, 3).forEach((article, index) => {
            console.log(`\n${index + 1}. ${article.title}`);
            console.log(`   ${article.summary.substring(0, 100)}...`);
            console.log(`   Дата: ${article.publishedDate}`);
            console.log(`   Источник: ${article.position}`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Исключение: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Запускаем тест
testImprovedParsers().catch(console.error); 