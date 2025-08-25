const fetch = require('node-fetch');

async function testTelegramBot() {
  try {
    console.log('🧪 Тестируем Telegram бота...');
    
    // Проверяем, что сервер работает
    const response = await fetch('http://localhost:3000/api/telegram/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '🧪 Тестовое сообщение из TaxNewsRadar!\n\n📅 Дата: ' + new Date().toLocaleString('ru-RU') + '\n\n✅ Если вы видите это сообщение, значит Telegram бот работает корректно!'
      })
    });

    console.log('📡 Статус ответа:', response.status);
    
    const data = await response.json();
    console.log('📄 Тело ответа:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Telegram API работает!');
      console.log('📱 Проверьте, пришло ли сообщение в Telegram');
    } else {
      console.log('❌ Telegram API вернул ошибку');
      console.log('🔍 Возможные причины:');
      console.log('   - Неправильный TELEGRAM_BOT_TOKEN');
      console.log('   - Неправильный TELEGRAM_CHAT_ID');
      console.log('   - Бот не добавлен в чат/группу');
      console.log('   - Сервер не перезапущен после изменения .env');
    }
    
  } catch (error) {
    console.error('💥 Ошибка при тестировании:', error.message);
  }
}

console.log('📋 Инструкция по настройке:');
console.log('1. Получите Bot Token у @BotFather');
console.log('2. Получите Chat ID через getUpdates');
console.log('3. Обновите .env файл');
console.log('4. Перезапустите сервер');
console.log('5. Запустите этот тест: node test-telegram-bot.js');
console.log('');

testTelegramBot();

