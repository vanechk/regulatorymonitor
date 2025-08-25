const fetch = require('node-fetch');

async function testServerHealth() {
  console.log('🏥 Проверяю здоровье сервера...');
  
  try {
    // Тест 1: Проверка основного endpoint
    console.log('\n📡 Тест 1: Основной endpoint');
    const response1 = await fetch('http://localhost:3000/api/test');
    console.log('Статус:', response1.status);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Ответ:', JSON.stringify(data1, null, 2));
    } else {
      const errorText = await response1.text();
      console.log('Ошибка:', errorText);
    }
    
    // Тест 2: Проверка auth endpoint
    console.log('\n🔐 Тест 2: Auth endpoint');
    const response2 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    console.log('Статус:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Ответ:', JSON.stringify(data2, null, 2));
    } else {
      const errorText = await response2.text();
      console.log('Ошибка:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Запускаем тест
testServerHealth();
