require('dotenv').config();

console.log('🔍 Проверяем переменные окружения Telegram...');
console.log('');

console.log('📱 TELEGRAM_BOT_TOKEN:');
console.log(process.env.TELEGRAM_BOT_TOKEN ? '✅ Установлен' : '❌ НЕ УСТАНОВЛЕН');
if (process.env.TELEGRAM_BOT_TOKEN) {
  console.log(`   Токен: ${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
}

console.log('');

console.log('🆔 TELEGRAM_CHAT_ID:');
console.log(process.env.TELEGRAM_CHAT_ID ? '✅ Установлен' : '❌ НЕ УСТАНОВЛЕН');
if (process.env.TELEGRAM_CHAT_ID) {
  console.log(`   Chat ID: ${process.env.TELEGRAM_CHAT_ID}`);
}

console.log('');

console.log('📋 Проверка формата:');
if (process.env.TELEGRAM_BOT_TOKEN) {
  const tokenParts = process.env.TELEGRAM_BOT_TOKEN.split(':');
  if (tokenParts.length === 2) {
    console.log('✅ Формат токена правильный (число:строка)');
  } else {
    console.log('❌ Неправильный формат токена');
  }
}

if (process.env.TELEGRAM_CHAT_ID) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (/^-?\d+$/.test(chatId)) {
    console.log('✅ Формат Chat ID правильный (число)');
  } else {
    console.log('❌ Неправильный формат Chat ID');
  }
}

console.log('');
console.log('💡 Если что-то не так:');
console.log('1. Проверьте .env файл');
console.log('2. Перезапустите сервер');
console.log('3. Убедитесь, что нет лишних пробелов');
