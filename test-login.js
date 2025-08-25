const fetch = require('node-fetch');

async function testLogin() {
  console.log('🧪 Тестирую вход в систему...');
  
  try {
    // Тест 1: Вход с username
    console.log('\n📝 Тест 1: Вход с username');
    const loginResponse1 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'TestPass123'
      })
    });
    
    const loginData1 = await loginResponse1.json();
    console.log('Статус:', loginResponse1.status);
    console.log('Ответ:', loginData1);
    
    // Тест 2: Вход с email
    console.log('\n📧 Тест 2: Вход с email');
    const loginResponse2 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123'
      })
    });
    
    const loginData2 = await loginResponse2.json();
    console.log('Статус:', loginResponse2.status);
    console.log('Ответ:', loginData2);
    
    // Тест 3: Проверка существующих пользователей
    console.log('\n🔍 Тест 3: Проверка существующих пользователей');
    const usersResponse = await fetch('http://localhost:3000/api/test');
    const usersData = await usersResponse.json();
    console.log('Статус:', usersResponse.status);
    console.log('Ответ:', usersData);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запускаем тест
testLogin();
