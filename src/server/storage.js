const fs = require('fs');
const path = require('path');

console.log('🔍 Storage: Инициализация файлового хранилища...');

const STORAGE_FILE = path.join(__dirname, 'users.json');
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

console.log('🔍 Storage: Файлы хранилища:', {
  users: STORAGE_FILE,
  tokens: TOKENS_FILE
});

// Функция для чтения данных из файла
function readFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ Storage: Данные прочитаны из ${path.basename(filePath)}`);
      return JSON.parse(data);
    } else {
      console.log(`🔍 Storage: Файл ${path.basename(filePath)} не существует, создаю с дефолтными значениями`);
      return defaultValue;
    }
  } catch (error) {
    console.error(`❌ Storage: Ошибка чтения файла ${path.basename(filePath)}:`, error.message);
    return defaultValue;
  }
}

// Функция для записи данных в файл
function writeFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Storage: Данные записаны в ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Storage: Ошибка записи в файл ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Загружаем существующие данные
let users = readFile(STORAGE_FILE, {});
let verificationTokens = readFile(TOKENS_FILE, {});

console.log('✅ Storage: Данные загружены:', {
  usersCount: Object.keys(users).length,
  tokensCount: Object.keys(verificationTokens).length
});

// Функции для работы с пользователями
function saveUser(email, userData) {
  users[email] = userData;
  const success = writeFile(STORAGE_FILE, users);
  if (success) {
    console.log(`✅ Storage: Пользователь ${email} сохранен`);
  }
  return success;
}

function getUser(email) {
  return users[email];
}

function getAllUsers() {
  return Object.values(users);
}

function userExists(email) {
  return users.hasOwnProperty(email);
}

// Функции для работы с токенами
function saveToken(token, email) {
  verificationTokens[token] = email;
  const success = writeFile(TOKENS_FILE, verificationTokens);
  if (success) {
    console.log(`✅ Storage: Токен для ${email} сохранен`);
  }
  return success;
}

function getTokenEmail(token) {
  return verificationTokens[token];
}

function removeToken(token) {
  if (verificationTokens[token]) {
    delete verificationTokens[token];
    const success = writeFile(TOKENS_FILE, verificationTokens);
    if (success) {
      console.log(`✅ Storage: Токен ${token.substring(0, 20)}... удален`);
    }
    return success;
  }
  return false;
}

// Функция для очистки истекших токенов (старше 24 часов)
function cleanupExpiredTokens() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
  
  let cleanedCount = 0;
  const tokensToRemove = [];
  
  Object.entries(verificationTokens).forEach(([token, email]) => {
    const user = users[email];
    if (user && user.createdAt) {
      const tokenAge = now - new Date(user.createdAt).getTime();
      if (tokenAge > oneDay) {
        tokensToRemove.push(token);
        cleanedCount++;
      }
    }
  });
  
  tokensToRemove.forEach(token => {
    delete verificationTokens[token];
  });
  
  if (cleanedCount > 0) {
    writeFile(TOKENS_FILE, verificationTokens);
    console.log(`🧹 Storage: Очищено ${cleanedCount} истекших токенов`);
  }
}

// Запускаем очистку каждые 6 часов
setInterval(cleanupExpiredTokens, 6 * 60 * 60 * 1000);

console.log('✅ Storage: Файловое хранилище инициализировано');

module.exports = {
  saveUser,
  getUser,
  getAllUsers,
  userExists,
  saveToken,
  getTokenEmail,
  removeToken,
  cleanupExpiredTokens
};
