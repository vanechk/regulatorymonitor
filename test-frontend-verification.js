const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testFrontendVerification() {
  console.log('🧪 Тестируем фронтенд верификацию (имитация перехода по ссылке)...\n');

  try {
    // 1. Регистрируем пользователя
    console.log('1️⃣ Регистрируем пользователя для тестирования...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'frontenduser_' + Date.now(),
        email: 'frontend_' + Date.now() + '@example.com',
        password: 'testpassword123'
      })
    });

    const registerData = await registerResponse.json();
    if (!registerResponse.ok) {
      console.log('❌ Ошибка регистрации:', registerData.error);
      return;
    }

    console.log('✅ Регистрация успешна');
    const token = registerData.verificationToken;
    console.log('🔑 Токен получен:', token.substring(0, 20) + '...');

    // 2. Имитируем переход по ссылке из письма
    console.log('\n2️⃣ Имитируем переход по ссылке из письма...');
    console.log('🔗 URL: http://localhost:5173/verify-email?token=' + token.substring(0, 20) + '...');
    
    // 3. Фронтенд должен вызвать check-verification-status
    console.log('\n3️⃣ Фронтенд вызывает /api/auth/check-verification-status...');
    const statusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const statusData = await statusResponse.json();
    console.log('📡 Статус ответа:', statusResponse.status);
    console.log('📡 Тело ответа:', statusData);

    if (statusResponse.ok && statusData.status === 'pending') {
      console.log('✅ Статус: pending - пользователь готов к подтверждению');
      
      // 4. Фронтенд должен вызвать verify-email
      console.log('\n4️⃣ Фронтенд вызывает /api/auth/verify-email...');
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
        console.log('👤 Пользователь:', verifyData.user.username);
        console.log('📧 Email:', verifyData.user.email);
        console.log('✅ Подтвержден:', verifyData.user.isVerified);
        
        // 5. Проверяем финальный статус
        console.log('\n5️⃣ Проверяем финальный статус...');
        const finalStatusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const finalStatusData = await finalStatusResponse.json();
        console.log('📡 Финальный статус:', finalStatusData.status);
        
        if (finalStatusData.status === 'invalid') {
          console.log('✅ Токен стал недействительным (правильно для безопасности)');
        }
        
      } else {
        console.log('❌ Ошибка верификации:', verifyData.error);
      }
      
    } else {
      console.log('❌ Неожиданный статус:', statusData.status || 'неизвестно');
    }

    console.log('\n✅ Тест фронтенд верификации завершен!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании фронтенд верификации:', error);
  }
}

// Запускаем тест
testFrontendVerification();
