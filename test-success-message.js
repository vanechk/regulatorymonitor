const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testSuccessMessage() {
  console.log('🧪 Тестируем, что всегда возвращается сообщение об успехе...\n');

  try {
    // 1. Регистрируем пользователя с тестовым email (который будет "отправлен")
    console.log('1️⃣ Регистрируем пользователя с тестовым email...');
    const registerResponse1 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'successuser1_' + Date.now(),
        email: 'success1_' + Date.now() + '@example.com',
        password: 'testpassword123'
      })
    });

    const registerData1 = await registerResponse1.json();
    console.log('📡 Статус ответа:', registerResponse1.status);
    console.log('📡 Сообщение:', registerData1.message);
    console.log('📡 Статус email:', registerData1.emailStatus);
    console.log('📡 Пользователь создан:', registerData1.user ? 'да' : 'нет');
    console.log('📡 Токен получен:', registerData1.verificationToken ? 'да' : 'нет');

    if (registerResponse1.ok) {
      console.log('✅ Первая регистрация успешна!');
    } else {
      console.log('❌ Первая регистрация не удалась:', registerData1.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Регистрируем пользователя с реальным email (который может не отправиться)
    console.log('2️⃣ Регистрируем пользователя с реальным email...');
    const registerResponse2 = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'successuser2_' + Date.now(),
        email: 'success2_' + Date.now() + '@gmail.com', // Реальный домен
        password: 'testpassword123'
      })
    });

    const registerData2 = await registerResponse2.json();
    console.log('📡 Статус ответа:', registerResponse2.status);
    console.log('📡 Сообщение:', registerData2.message);
    console.log('📡 Статус email:', registerData2.emailStatus);
    console.log('📡 Пользователь создан:', registerData2.user ? 'да' : 'нет');
    console.log('📡 Токен получен:', registerData2.verificationToken ? 'да' : 'нет');

    if (registerResponse2.ok) {
      console.log('✅ Вторая регистрация успешна!');
    } else {
      console.log('❌ Вторая регистрация не удалась:', registerData2.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Проверяем, что оба пользователя созданы в базе
    console.log('3️⃣ Проверяем создание пользователей в базе...');
    
    // Проверяем временных пользователей
    const pendingResponse = await fetch(`${API_BASE}/auth/pending-users`);
    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      console.log('📊 Временных пользователей:', pendingData.pendingUsers ? pendingData.pendingUsers.length : 'неизвестно');
    }

    // Проверяем основных пользователей
    const usersResponse = await fetch(`${API_BASE}/auth/users`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('📊 Основных пользователей:', usersData.users ? usersData.users.length : 'неизвестно');
    }

    console.log('\n✅ Тест завершен!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запускаем тест
testSuccessMessage();
