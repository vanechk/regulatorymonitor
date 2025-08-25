#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Конфигурация
const config = {
  clientPort: 5173,
  serverPort: 3001,
  host: 'localhost' // Измените на ваш IP или домен
};

// Функция для проверки доступности порта
function checkPort(host, port, description) {
  return new Promise((resolve) => {
    const client = http;
    const req = client.request({
      host: host,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ ${description} (порт ${port}): Доступен`);
      console.log(`   Статус: ${res.statusCode}`);
      console.log(`   URL: http://${host}:${port}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${description} (порт ${port}): Недоступен`);
      console.log(`   Ошибка: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${description} (порт ${port}): Таймаут`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Основная функция проверки
async function checkExternalAccess() {
  console.log('🔍 Проверка внешнего доступа к TaxNewsRadar...\n');
  
  // Получаем IP адрес
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Ищем локальный IP адрес
  for (const name of Object.keys(networkInterfaces)) {
    for (const interface of networkInterfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        localIP = interface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`📍 Локальный IP адрес: ${localIP}\n`);
  
  // Проверяем клиент
  const clientAvailable = await checkPort(localIP, config.clientPort, 'Клиент (React)');
  
  // Проверяем сервер
  const serverAvailable = await checkPort(localIP, config.serverPort, 'Сервер (API)');
  
  console.log('\n📋 Результаты проверки:');
  console.log('========================');
  
  if (clientAvailable && serverAvailable) {
    console.log('🎉 Все сервисы доступны!');
    console.log(`\n🌐 Внешние ссылки:`);
    console.log(`   Клиент: http://${localIP}:${config.clientPort}`);
    console.log(`   API: http://${localIP}:${config.serverPort}`);
    console.log(`\n📧 Для настройки email уведомлений:`);
    console.log(`   Обновите FRONTEND_URL в .env файле:`);
    console.log(`   FRONTEND_URL="http://${localIP}:${config.clientPort}"`);
  } else {
    console.log('⚠️  Некоторые сервисы недоступны');
    console.log('\n🔧 Рекомендации:');
    
    if (!clientAvailable) {
      console.log('   - Убедитесь, что клиент запущен: npm run dev:client');
      console.log('   - Проверьте, что порт 5173 не занят другим процессом');
    }
    
    if (!serverAvailable) {
      console.log('   - Убедитесь, что сервер запущен: npm run dev:server');
      console.log('   - Проверьте, что порт 3001 не занят другим процессом');
    }
    
    console.log('\n🔒 Для внешнего доступа:');
    console.log('   - Настройте файрвол для портов 3001 и 5173');
    console.log('   - Убедитесь, что CORS настроен правильно');
  }
  
  console.log('\n📖 Подробная документация: EXTERNAL_ACCESS.md');
}

// Запуск проверки
if (require.main === module) {
  checkExternalAccess().catch(console.error);
}

module.exports = { checkExternalAccess };
