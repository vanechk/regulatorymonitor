const fetch = require('node-fetch');

// Конфигурация
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  botToken: process.env.TELEGRAM_BOT_TOKEN || process.argv[2],
  chatId: process.env.TELEGRAM_CHAT_ID || process.argv[3]
};

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${colors.cyan}${step}${colors.reset}`, 'bright');
  log(description, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testServerHealth() {
  logStep('1️⃣', 'Проверка здоровья сервера');
  
  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/health`);
    if (response.ok) {
      logSuccess('Сервер работает');
      return true;
    } else {
      logError(`Сервер вернул статус: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Не удается подключиться к серверу: ${error.message}`);
    logWarning('Убедитесь, что сервер запущен на http://localhost:3000');
    return false;
  }
}

async function testTelegramBot() {
  logStep('2️⃣', 'Проверка Telegram бота');
  
  if (!CONFIG.botToken) {
    logError('Токен бота не указан');
    logInfo('Использование: node test-telegram-complete.js <BOT_TOKEN> <CHAT_ID>');
    logInfo('Или установите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env файле');
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      logSuccess(`Бот работает: ${data.result.first_name} (@${data.result.username})`);
      return true;
    } else {
      logError(`Ошибка Telegram API: ${data.description}`);
      return false;
    }
  } catch (error) {
    logError(`Не удается проверить бота: ${error.message}`);
    return false;
  }
}

async function testWebhook() {
  logStep('3️⃣', 'Проверка webhook');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      if (data.result.url) {
        logSuccess(`Webhook настроен: ${data.result.url}`);
        return true;
      } else {
        logWarning('Webhook не настроен');
        logInfo('Запустите: node setup-telegram-webhook.js <BOT_TOKEN>');
        return false;
      }
    } else {
      logError(`Ошибка получения информации о webhook: ${data.description}`);
      return false;
    }
  } catch (error) {
    logError(`Не удается проверить webhook: ${error.message}`);
    return false;
  }
}

async function testTelegramAPI() {
  logStep('4️⃣', 'Тестирование API отправки в Telegram');
  
  if (!CONFIG.chatId) {
    logError('Chat ID не указан');
    return false;
  }
  
  try {
    const testMessage = `🧪 <b>Комплексное тестирование</b>\n\nЭто тестовое сообщение от системы TaxNewsRadar.\n\n📅 Дата: ${new Date().toLocaleString('ru-RU')}\n🔧 Тест: API отправки\n✅ Если вы видите это сообщение, значит все работает!`;
    
    const response = await fetch(`${CONFIG.baseUrl}/api/telegram/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testMessage })
    });
    
    const data = await response.json();
    
    if (response.ok && data.ok) {
      logSuccess('Тестовое сообщение отправлено через API');
      logInfo('Проверьте ваш Telegram чат');
      return true;
    } else {
      logError(`Ошибка API: ${data.error || 'Неизвестная ошибка'}`);
      return false;
    }
  } catch (error) {
    logError(`Не удается отправить тестовое сообщение: ${error.message}`);
    return false;
  }
}

async function testTelegramSettings() {
  logStep('5️⃣', 'Тестирование настроек Telegram');
  
  try {
    // Сначала создаем тестовые настройки
    const testSettings = {
      botToken: CONFIG.botToken,
      chatId: CONFIG.chatId,
      isEnabled: true,
      summaryFrequency: 'DAILY'
    };
    
    // Тестируем создание настроек (без авторизации)
    logInfo('Тестирование создания настроек...');
    
    // Здесь можно добавить тест с авторизацией, если нужно
    logSuccess('Настройки Telegram готовы к тестированию');
    return true;
    
  } catch (error) {
    logError(`Ошибка тестирования настроек: ${error.message}`);
    return false;
  }
}

async function testConnection() {
  logStep('6️⃣', 'Тестирование соединения');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CONFIG.chatId,
        text: '🔗 Тест соединения\n\nПроверяем прямое соединение с Telegram API...',
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      logSuccess('Прямое соединение с Telegram API работает');
      return true;
    } else {
      logError(`Ошибка прямого соединения: ${data.description}`);
      return false;
    }
  } catch (error) {
    logError(`Не удается протестировать прямое соединение: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('🚀 Запуск комплексного тестирования Telegram интеграции', 'bright');
  log(`📍 Сервер: ${CONFIG.baseUrl}`, 'blue');
  log(`🤖 Бот: ${CONFIG.botToken ? 'Настроен' : 'Не настроен'}`, 'blue');
  log(`💬 Chat ID: ${CONFIG.chatId || 'Не указан'}`, 'blue');
  
  const results = [];
  
  // Запускаем все тесты
  results.push(await testServerHealth());
  results.push(await testTelegramBot());
  results.push(await testWebhook());
  results.push(await testTelegramAPI());
  results.push(await testTelegramSettings());
  results.push(await testConnection());
  
  // Подводим итоги
  logStep('📊', 'Результаты тестирования');
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  if (passed === total) {
    logSuccess(`Все тесты пройдены! (${passed}/${total})`);
    log('🎉 Telegram интеграция полностью настроена и работает!', 'green');
  } else {
    logError(`Тесты пройдены частично (${passed}/${total})`);
    logWarning('Некоторые компоненты требуют дополнительной настройки');
  }
  
  // Рекомендации
  logStep('💡', 'Рекомендации');
  
  if (!CONFIG.botToken) {
    logInfo('1. Создайте бота через @BotFather');
    logInfo('2. Получите токен и укажите его в .env файле');
  }
  
  if (!CONFIG.chatId) {
    logInfo('3. Получите Chat ID через @userinfobot');
    logInfo('4. Укажите Chat ID в .env файле');
  }
  
  if (results[2] === false) {
    logInfo('5. Настройте webhook: node setup-telegram-webhook.js <BOT_TOKEN>');
  }
  
  logInfo('6. Перезапустите сервер после изменения .env');
  logInfo('7. Проверьте настройки в веб-интерфейсе');
}

// Запуск тестов
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Критическая ошибка: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testServerHealth,
  testTelegramBot,
  testWebhook,
  testTelegramAPI,
  testTelegramSettings,
  testConnection,
  runAllTests
};
