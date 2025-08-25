const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testVerificationFlow() {
  console.log('🧪 Тестируем новую логику подтверждения email...\n');

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

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.log('❌ Ошибка регистрации:', errorData);
      return;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Регистрация успешна:', registerData.message);
    console.log('📧 Пользователь:', registerData.user.email);
    console.log('🔑 Токен верификации:', registerData.verificationToken);

    // 2. Проверяем статус пользователя с полученным токеном
    console.log('\n2️⃣ Проверяем статус пользователя...');
    const statusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: registerData.verificationToken })
    });

    const statusData = await statusResponse.json();
    console.log('📡 Статус ответа:', statusResponse.status);
    console.log('📡 Тело ответа:', statusData);

    if (statusData.status === 'pending') {
      console.log('✅ Пользователь готов к подтверждению');
    } else if (statusData.status === 'verified') {
      console.log('✅ Пользователь уже подтвержден');
    } else {
      console.log('❌ Неожиданный статус:', statusData.status);
    }

    // 3. Тестируем подтверждение email с полученным токеном
    console.log('\n3️⃣ Тестируем подтверждение email...');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: registerData.verificationToken })
    });

    const verifyData = await verifyResponse.json();
    console.log('📡 Статус ответа:', verifyResponse.status);
    console.log('📡 Тело ответа:', verifyData);

    if (verifyResponse.ok && verifyData.message) {
      console.log('✅ Успешное подтверждение email:', verifyData.message);
    } else {
      console.log('❌ Ошибка подтверждения:', verifyData.error);
    }

    // 4. Проверяем статус после подтверждения
    console.log('\n4️⃣ Проверяем статус после подтверждения...');
    const finalStatusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: registerData.verificationToken })
    });

    const finalStatusData = await finalStatusResponse.json();
    console.log('📡 Финальный статус:', finalStatusData.status);
    console.log('📡 Финальное сообщение:', finalStatusData.message);

    if (finalStatusData.status === 'verified') {
      console.log('✅ Пользователь успешно подтвержден');
    } else {
      console.log('❌ Пользователь не подтвержден:', finalStatusData.error);
    }

    // 5. Тестируем подтверждение с недействительным токеном
    console.log('\n5️⃣ Тестируем подтверждение с недействительным токеном...');
    const invalidTokenResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token' })
    });

    const invalidTokenData = await invalidTokenResponse.json();
    console.log('📡 Статус ответа:', invalidTokenResponse.status);
    console.log('📡 Тело ответа:', invalidTokenData);

    if (invalidTokenResponse.status === 400) {
      console.log('✅ Правильно обработана ошибка с недействительным токеном');
    } else {
      console.log('❌ Неправильная обработка недействительного токена');
    }

    console.log('\n✅ Тест завершен. Проверьте логи выше для анализа ответов.');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запускаем тест
testVerificationFlow();
