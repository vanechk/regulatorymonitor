// Тест для API endpoint повторной отправки письма
const testResendVerification = async () => {
  try {
    console.log('🧪 Тестируем API endpoint повторной отправки письма...');
    
    const response = await fetch('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'test@example.com' // Замените на реальный email для тестирования
      }),
    });

    const data = await response.json();
    
    console.log('📧 Ответ сервера:', {
      status: response.status,
      statusText: response.statusText,
      data
    });

    if (response.ok) {
      console.log('✅ Письмо успешно отправлено повторно!');
      console.log('📝 Сообщение:', data.message);
    } else {
      console.log('❌ Ошибка при отправке:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Ошибка при тестировании:', error.message);
  }
};

// Запускаем тест
testResendVerification();
