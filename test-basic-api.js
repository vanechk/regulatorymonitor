// Простой тест базового подключения к API
const testBasicAPI = async () => {
  try {
    console.log('🧪 Тестируем базовое подключение к API...');
    
    // Тест 1: Проверяем корневой endpoint
    console.log('\n1️⃣ Тестируем GET /...');
    const rootResponse = await fetch('http://localhost:3000/');
    console.log('📡 Статус:', rootResponse.status);
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.text();
      console.log('✅ Ответ получен:', rootData);
    } else {
      console.log('❌ Ошибка при получении корневого endpoint');
    }
    
    // Тест 2: Проверяем API sources
    console.log('\n2️⃣ Тестируем GET /api/sources...');
    const sourcesResponse = await fetch('http://localhost:3000/api/sources');
    console.log('📡 Статус:', sourcesResponse.status);
    
    if (sourcesResponse.ok) {
      const sourcesData = await sourcesResponse.text();
      console.log('✅ Ответ получен:', sourcesData);
    } else {
      console.log('❌ Ошибка при получении sources');
    }
    
    console.log('\n✅ Базовый тест завершен!');
    
  } catch (error) {
    console.error('💥 Ошибка при тестировании:', error.message);
    console.log('\n🔍 Возможные причины:');
    console.log('- Сервер не запущен на порту 3000');
    console.log('- Проблема с сетевым подключением');
    console.log('- Блокировка брандмауэром');
  }
};

// Запускаем тест
testBasicAPI();
