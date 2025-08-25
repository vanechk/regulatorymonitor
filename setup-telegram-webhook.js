const fetch = require('node-fetch');

async function setupTelegramWebhook() {
  try {
    // Получаем токен из переменных окружения или просим ввести
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
    
    if (!botToken) {
      console.log('❌ Нужен токен бота!');
      console.log('Использование: node setup-telegram-webhook.js <BOT_TOKEN>');
      console.log('Или установите TELEGRAM_BOT_TOKEN в .env файле');
      return;
    }
    
    console.log('🔧 Настраиваем webhook для Telegram бота...');
    
    // URL вашего webhook (замените на ваш домен)
    const webhookUrl = 'http://localhost:3000/api/telegram/webhook';
    
    // Устанавливаем webhook
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      })
    });
    
    const data = await response.json();
    console.log('📡 Ответ от Telegram:', JSON.stringify(data, null, 2));
    
    if (data.ok) {
      console.log('✅ Webhook успешно настроен!');
      console.log('📱 Теперь напишите боту /start');
      console.log('🆔 Бот автоматически покажет ваш Chat ID');
    } else {
      console.log('❌ Ошибка настройки webhook:', data.description);
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

setupTelegramWebhook();
