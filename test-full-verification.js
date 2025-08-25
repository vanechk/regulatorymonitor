const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testFullVerification() {
  console.log('🧪 Тестируем полный цикл верификации...\n');

  try {
    // 1. Регистрируем нового пользователя
    console.log('1️⃣ Регистрируем нового пользователя...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'verifuser_' + Date.now(),
        email: 'verify_' + Date.now() + '@example.com',
        password: 'testpassword123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('📡 Статус ответа:', registerResponse.status);
    
    if (!registerResponse.ok) {
      console.log('❌ Ошибка регистрации:', registerData.error);
      return;
    }

    console.log('✅ Регистрация успешна:', registerData.message);
    console.log('📧 Пользователь:', registerData.user.email);
    console.log('🔑 Токен верификации:', registerData.verificationToken ? registerData.verificationToken.substring(0, 20) + '...' : 'отсутствует');

    if (!registerData.verificationToken) {
      console.log('❌ Токен верификации не получен');
      return;
    }

    const token = registerData.verificationToken;
    
    // 2. Проверяем статус токена
    console.log('\n2️⃣ Проверяем статус токена верификации...');
    const statusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const statusData = await statusResponse.json();
    console.log('📡 Статус ответа:', statusResponse.status);
    console.log('📡 Тело ответа:', statusData);

    if (statusResponse.ok && statusData.status === 'pending') {
      console.log('✅ Статус токена: pending (готов к подтверждению)');
    } else {
      console.log('❌ Неожиданный статус токена:', statusData.status || 'неизвестно');
      return;
    }

    // 3. Выполняем верификацию
    console.log('\n3️⃣ Выполняем верификацию email...');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const verifyData = await verifyResponse.json();
    console.log('📡 Статус ответа:', verifyResponse.status);
    console.log('📡 Тело ответа:', verifyData);

    if (verifyResponse.ok) {
      console.log('✅ Верификация успешна:', verifyData.message);
    } else {
      console.log('❌ Ошибка верификации:', verifyData.error);
      return;
    }

    // 4. Проверяем финальный статус
    console.log('\n4️⃣ Проверяем финальный статус токена...');
    const finalStatusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const finalStatusData = await finalStatusResponse.json();
    console.log('📡 Статус ответа:', finalStatusResponse.status);
    console.log('📡 Тело ответа:', finalStatusData);

    if (finalStatusResponse.ok && finalStatusData.status === 'verified') {
      console.log('✅ Финальный статус: verified (email подтвержден)');
    } else {
      console.log('❌ Неожиданный финальный статус:', finalStatusData.status || 'неизвестно');
    }

    // 5. Проверяем, что пользователь перемещен в основную таблицу
    console.log('\n5️⃣ Проверяем перемещение пользователя в основную таблицу...');
    const usersResponse = await fetch(`${API_BASE}/auth/users`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('📊 Пользователей в основной таблице:', usersData.users ? usersData.users.length : 'неизвестно');
      
      if (usersData.users && usersData.users.length > 0) {
        const verifiedUser = usersData.users.find(u => u.email === registerData.user.email);
        if (verifiedUser) {
          console.log('✅ Пользователь найден в основной таблице:', verifiedUser.email);
          console.log('✅ Статус верификации:', verifiedUser.isVerified);
        } else {
          console.log('❌ Пользователь не найден в основной таблице');
        }
      }
    }

    console.log('\n✅ Полный тест верификации завершен!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании верификации:', error);
  }
}

// Запускаем тест
testFullVerification();
