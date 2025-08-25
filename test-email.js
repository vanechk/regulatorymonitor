const { sendVerificationEmail } = require('./src/utils/email.js');

async function testEmail() {
  console.log('🧪 Тестируем email функциональность...\n');

  try {
    console.log('1️⃣ Тестируем отправку email с подтверждением...');
    
    const testEmail = 'test@example.com';
    const testUsername = 'testuser';
    const testToken = 'test-token-' + Date.now();
    
    console.log('📧 Параметры теста:');
    console.log('   Email:', testEmail);
    console.log('   Username:', testUsername);
    console.log('   Token:', testToken.substring(0, 20) + '...');
    
    const result = await sendVerificationEmail(testEmail, testUsername, testToken);
    
    if (result) {
      console.log('✅ Email успешно отправлен!');
    } else {
      console.log('❌ Email не был отправлен');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при отправке email:', error.message);
    console.error('🔍 Детали ошибки:', {
      name: error.name,
      stack: error.stack
    });
  }
}

// Запускаем тест
testEmail();
