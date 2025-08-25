const { sendVerificationEmail } = require('./src/utils/email');

async function testEmailDesign() {
  try {
    console.log('🚀 Тестирование нового дизайна email письма...');
    
    // Тестовые данные
    const testEmail = 'test@example.com';
    const testUsername = 'ТестовыйПользователь';
    const testToken = 'test-verification-token-123456789';
    
    // Отправляем тестовое письмо
    await sendVerificationEmail(testEmail, testUsername, testToken);
    
    console.log('✅ Тестовое письмо отправлено успешно!');
    console.log('📧 Проверьте почтовый ящик:', testEmail);
    console.log('🎨 Новый дизайн должен выглядеть потрясающе!');
    
  } catch (error) {
    console.error('❌ Ошибка при отправке тестового письма:', error.message);
  }
}

// Запускаем тест
testEmailDesign();
