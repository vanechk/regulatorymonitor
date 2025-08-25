// Тест подключения к API
const testApiConnection = async () => {
  try {
    console.log('🧪 Тестируем подключение к API...');
    
    // Тест 1: Проверяем базовый endpoint
    console.log('\n1️⃣ Тестируем GET /api/sources...');
    const sourcesResponse = await fetch('http://localhost:3000/api/sources');
    console.log('📡 Статус:', sourcesResponse.status);
    
    if (sourcesResponse.ok) {
      const sources = await sourcesResponse.json();
      console.log('✅ Ответ получен:', sources);
    } else {
      console.log('❌ Ошибка при получении источников');
    }
    
    // Тест 2: Проверяем endpoint верификации (должен вернуть ошибку без токена)
    console.log('\n2️⃣ Тестируем POST /api/auth/verify-email...');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'test-token' }),
    });
    
    console.log('📡 Статус:', verifyResponse.status);
    const verifyData = await verifyResponse.json();
    console.log('📝 Ответ:', verifyData);
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('💥 Ошибка при тестировании:', error.message);
    console.log('\n🔍 Возможные причины:');
    console.log('- Сервер не запущен на порту 3000');
    console.log('- Проблема с CORS');
    console.log('- Сервер запущен на другом порту');
  }
};

// Запускаем тест
testApiConnection();
