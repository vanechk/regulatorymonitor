const fetch = require('node-fetch');

async function getChatId() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
    
    if (!botToken) {
      console.log('❌ Нужен токен бота!');
      console.log('Использование: node get-chat-id.js <BOT_TOKEN>');
      return;
    }
    
    console.log('🔍 Получаем Chat ID...');
    console.log('📱 Напишите боту ЛЮБОЕ сообщение в Telegram');
    console.log('⏳ Ждем 10 секунд...');
    
    // Ждем 10 секунд, чтобы пользователь написал боту
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Получаем обновления
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await response.json();
    
    console.log('📡 Ответ от Telegram:', JSON.stringify(data, null, 2));
    
    if (data.ok && data.result.length > 0) {
      const lastMessage = data.result[data.result.length - 1];
      const chatId = lastMessage.message.chat.id;
      const userName = lastMessage.message.from.first_name || 'Пользователь';
      
      console.log('✅ Chat ID получен!');
      console.log(`👤 Пользователь: ${userName}`);
      console.log(`🆔 Chat ID: ${chatId}`);
      console.log('');
      console.log('📝 Добавьте в ваш .env файл:');
      console.log(`TELEGRAM_CHAT_ID="${chatId}"`);
      
    } else {
      console.log('❌ Сообщения не найдены');
      console.log('💡 Убедитесь, что:');
      console.log('   1. Вы написали боту сообщение');
      console.log('   2. Прошло достаточно времени');
      console.log('   3. Токен бота правильный');
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

getChatId();
