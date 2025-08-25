require('dotenv').config();

console.log('🔧 Проверка переменных окружения...\n');

const requiredVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const optionalVars = [
  'EMAIL_PORT',
  'EMAIL_FROM',
  'NODE_ENV',
  'PORT'
];

console.log('📋 Обязательные переменные:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('SECRET') || varName.includes('PASS') ? '***' : value) : 'НЕ НАСТРОЕНА';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📋 Опциональные переменные:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  console.log(`${status} ${varName}: ${value || 'НЕ НАСТРОЕНА'}`);
});

console.log('\n🔍 Проверка .env файла:');
try {
  const fs = require('fs');
  const envPath = '.env';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`✅ .env файл найден, ${lines.length} настроек`);
    
    // Проверяем, есть ли пустые значения
    const emptyVars = lines.filter(line => {
      const [key, value] = line.split('=');
      return !value || value.trim() === '';
    });
    
    if (emptyVars.length > 0) {
      console.log('⚠️  Переменные с пустыми значениями:');
      emptyVars.forEach(line => console.log(`   ${line}`));
    }
  } else {
    console.log('❌ .env файл не найден');
  }
} catch (error) {
  console.log('❌ Ошибка при чтении .env файла:', error.message);
}

console.log('\n💡 Рекомендации:');
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.log('❌ JWT_SECRET и JWT_REFRESH_SECRET обязательны для работы аутентификации');
}
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL обязателен для подключения к базе данных');
}
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('⚠️  EMAIL настройки неполные - email верификация может не работать');
}
