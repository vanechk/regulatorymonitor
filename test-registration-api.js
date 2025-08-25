// Тест API регистрации
const testRegistrationAPI = async () => {
  try {
    console.log('🧪 Тестируем API регистрации...');
    
    // Тест 1: Проверяем GET endpoint
    console.log('\n1️⃣ Тестируем GET /api/sources...');
    const sourcesResponse = await fetch('http://localhost:3000/api/sources');
    console.log('📡 Статус:', sourcesResponse.status);
    
    if (sourcesResponse.ok) {
      const sources = await sourcesResponse.text();
      console.log('✅ Ответ получен:', sources);
    } else {
      console.log('❌ Ошибка при получении источников');
    }
    
    // Тест 2: Проверяем POST endpoint регистрации
    console.log('\n2️⃣ Тестируем POST /api/auth/register...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      }),
    });
    
    console.log('📡 Статус:', registerResponse.status);
    console.log('📡 Headers:', Object.fromEntries(registerResponse.headers.entries()));
    
    const responseText = await registerResponse.text();
    console.log('📝 Ответ (текст):', responseText);
    
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📝 Ответ (JSON):', responseJson);
      } catch (e) {
        console.log('❌ Ответ не является валидным JSON');
      }
    } else {
      console.log('❌ Пустой ответ от сервера');
    }
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('💥 Ошибка при тестировании:', error.message);
    console.log('\n🔍 Возможные причины:');
    console.log('- Сервер не запущен на порту 3000');
    console.log('- Проблема с CORS');
    console.log('- Сервер не отвечает на POST запросы');
  }
};

// Запускаем тест
testRegistrationAPI();
