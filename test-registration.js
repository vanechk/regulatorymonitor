const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testRegistration() {
  console.log('🧪 Тестируем полную регистрацию с email...\n');

  try {
    // 1. Регистрируем нового пользователя
    console.log('1️⃣ Регистрируем нового пользователя...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'testpassword123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('📡 Статус ответа:', registerResponse.status);
    console.log('📡 Тело ответа:', registerData);

    if (registerResponse.ok) {
      console.log('✅ Регистрация успешна:', registerData.message);
      console.log('📧 Пользователь:', registerData.user.email);
      
      // 2. Проверяем, что пользователь создан в базе
      console.log('\n2️⃣ Проверяем создание пользователя в базе...');
      const usersResponse = await fetch(`${API_BASE}/auth/users`);
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Список пользователей получен');
        console.log('📊 Всего пользователей:', usersData.users ? usersData.users.length : 'неизвестно');
      } else {
        console.log('❌ Не удалось получить список пользователей');
      }
      
      // 3. Проверяем список временных пользователей
      console.log('\n3️⃣ Проверяем список временных пользователей...');
      const pendingResponse = await fetch(`${API_BASE}/auth/pending-users`);
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('✅ Список временных пользователей получен');
        console.log('📊 Временных пользователей:', pendingData.pendingUsers ? pendingData.pendingUsers.length : 'неизвестно');
      } else {
        console.log('❌ Не удалось получить список временных пользователей');
      }
      
    } else {
      console.log('❌ Ошибка регистрации:', registerData.error);
    }

    console.log('\n✅ Тест регистрации завершен!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании регистрации:', error);
  }
}

// Запускаем тест
testRegistration();
