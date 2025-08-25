const { parseSource } = require('./src/parsers');

async function testParsers() {
  console.log('Тестирование парсеров...\n');
  
  const testSources = [
    {
      name: 'Минфин РФ',
      url: 'https://minfin.gov.ru/ru/',
      type: 'website'
    },
    {
      name: 'Федеральная налоговая служба России',
      url: 'https://nalog.gov.ru/',
      type: 'website'
    },
    {
      name: 'РИА Новости',
      url: 'https://ria.ru/',
      type: 'website'
    },
    {
      name: 'Ведомости',
      url: 'https://vedomosti.ru/',
      type: 'website'
    }
  ];
  
  const keywords = ['налог', 'фнс', 'налоговые'];
  
  for (const source of testSources) {
    console.log(`\n--- Тестирование парсера для ${source.name} ---`);
    console.log(`URL: ${source.url}`);
    
    try {
      const startTime = Date.now();
      const result = await parseSource(source.name, source.url, keywords);
      const endTime = Date.now();
      
      console.log(`Время выполнения: ${endTime - startTime}ms`);
      
      if (result.error) {
        console.log(`❌ Ошибка: ${result.error}`);
      } else {
        console.log(`✅ Найдено статей: ${result.articles.length}`);
        
        if (result.articles.length > 0) {
          console.log('\nПервые 3 статьи:');
          result.articles.slice(0, 3).forEach((article, index) => {
            console.log(`\n${index + 1}. ${article.title}`);
            console.log(`   Дата: ${article.publishedDate}`);
            console.log(`   URL: ${article.url}`);
            console.log(`   Краткое описание: ${article.summary.substring(0, 100)}...`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Исключение: ${error.message}`);
    }
  }
  
  console.log('\n--- Тестирование завершено ---');
}

// Запускаем тест
testParsers().catch(console.error); 