const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🧪 Тестируем endpoints основного сервера...\n');

  try {
    // 1. Тестируем базовый endpoint
    console.log('1️⃣ Тестируем /api/test...');
    try {
      const testResponse = await fetch(`${API_BASE}/test`);
      const testData = await testResponse.json();
      console.log('✅ /api/test работает:', testData.message);
    } catch (error) {
      console.log('❌ /api/test не работает:', error.message);
    }

    // 2. Тестируем endpoint проверки статуса верификации
    console.log('\n2️⃣ Тестируем /api/auth/check-verification-status...');
    try {
      const statusResponse = await fetch(`${API_BASE}/auth/check-verification-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'test-token' })
      });
      
      if (statusResponse.status === 400) {
        const statusData = await statusResponse.json();
        console.log('✅ /api/auth/check-verification-status работает (ожидаемая ошибка):', statusData.error);
      } else {
        console.log('❌ /api/auth/check-verification-status вернул неожиданный статус:', statusResponse.status);
      }
    } catch (error) {
      console.log('❌ /api/auth/check-verification-status не работает:', error.message);
    }

    // 3. Тестируем endpoint верификации
    console.log('\n3️⃣ Тестируем /api/auth/verify-email...');
    try {
      const verifyResponse = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'test-token' })
      });
      
      if (verifyResponse.status === 400) {
        const verifyData = await verifyResponse.json();
        console.log('✅ /api/auth/verify-email работает (ожидаемая ошибка):', verifyData.error);
      } else {
        console.log('❌ /api/auth/verify-email вернул неожиданный статус:', verifyResponse.status);
      }
    } catch (error) {
      console.log('❌ /api/auth/verify-email не работает:', error.message);
    }

    // 4. Тестируем endpoint регистрации
    console.log('\n4️⃣ Тестируем /api/auth/register...');
    try {
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser_' + Date.now(),
          email: 'test_' + Date.now() + '@example.com',
          password: 'testpassword123'
        })
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('✅ /api/auth/register работает:', registerData.message);
      } else {
        const registerData = await registerResponse.json();
        console.log('❌ /api/auth/register вернул ошибку:', registerData.error);
      }
    } catch (error) {
      console.log('❌ /api/auth/register не работает:', error.message);
    }

    console.log('\n✅ Тест endpoints завершен!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании endpoints:', error);
  }
}

// Запускаем тест
testEndpoints();
