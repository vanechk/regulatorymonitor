const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email.js');
const { 
  saveUser, 
  getUser, 
  getAllUsers, 
  userExists, 
  saveToken, 
  getTokenEmail, 
  removeToken 
} = require('./storage.js');

const router = express.Router();

console.log('🔍 Simple API: Роутер создается');
console.log('🔍 Simple API: Использую файловое хранилище');

// Middleware для логирования всех запросов
router.use((req, res, next) => {
  console.log(`🔍 Simple API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('🔍 Simple API: Headers:', req.headers);
  console.log('🔍 Simple API: Body:', req.body);
  next();
});

// Генерация токена подтверждения
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}



// Простой тестовый роут
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Регистрация пользователя (без базы данных)
router.post('/auth/register', async (req, res) => {
  console.log('🔍 Simple API: /api/auth/register - запрос получен');
  console.log('🔍 Simple API: Body запроса:', req.body);
  
  const { username, email, password } = req.body;
  
  console.log('🔍 Simple API: Парсинг данных:', { username, email, password: password ? '***' : 'отсутствует' });

  if (!username || !email || !password) {
    console.log('❌ Simple API: Отсутствуют обязательные поля');
    return res.status(400).json({ 
      error: 'Все поля обязательны для заполнения' 
    });
  }

  // Проверяем, не существует ли уже пользователь
  if (userExists(email)) {
    console.log('❌ Simple API: Пользователь с таким email уже существует');
    return res.status(400).json({ 
      error: 'Пользователь с таким email уже зарегистрирован' 
    });
  }

  console.log('✅ Simple API: Все поля заполнены, начинаю обработку');

  try {
    // Хешируем пароль
    console.log('🔍 Simple API: Хеширую пароль...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Simple API: Пароль захеширован');

    // Генерируем токен верификации
    console.log('🔍 Simple API: Генерирую токен верификации...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('✅ Simple API: Токен верификации сгенерирован:', verificationToken.substring(0, 20) + '...');

    // Создаем пользователя
    const user = {
      id: crypto.randomUUID(),
      username,
      email,
      hashedPassword,
      isVerified: false,
      createdAt: new Date().toISOString(),
      verificationToken
    };

    // Сохраняем пользователя и токен в файловое хранилище
    const userSaved = saveUser(email, user);
    const tokenSaved = saveToken(verificationToken, email);
    
    if (!userSaved || !tokenSaved) {
      console.error('❌ Simple API: Ошибка сохранения в файловое хранилище');
      return res.status(500).json({ 
        error: 'Ошибка при сохранении пользователя' 
      });
    }
    
    console.log('✅ Simple API: Пользователь сохранен в файловое хранилище:', {
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    });

    // Отправляем email
    console.log('🔍 Simple API: Начинаю отправку email верификации...');
    console.log('🔍 Simple API: Email будет отправлен на:', email);
    
    try {
      await sendVerificationEmail(email, username, verificationToken);
      console.log(`✅ Simple API: Email верификации успешно отправлен на ${email}`);
      
      res.json({ 
        message: 'Регистрация успешна. Проверьте ваш email для подтверждения аккаунта.',
        user: { username, email, isVerified: false },
        verificationToken // В продакшене не отправляем токен
      });
      
    } catch (emailError) {
      console.error('❌ Simple API: Ошибка при отправке email верификации:', emailError);
      console.error('❌ Simple API: Детали ошибки email:', {
        message: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        response: emailError.response,
        command: emailError.command
      });
      
      res.json({ 
        message: 'Регистрация успешна, но возникла проблема с отправкой email. Обратитесь к администратору.',
        error: emailError.message,
        user: { username, email, isVerified: false },
        verificationToken: verificationToken // В продакшене не отправляем токен
      });
    }

  } catch (error) {
    console.error('❌ Simple API: Общая ошибка при регистрации:', error);
    console.error('❌ Simple API: Детали общей ошибки:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при регистрации' 
    });
  }
});

// Email verification endpoint
router.post('/auth/verify-email', async (req, res) => {
  console.log('🔍 Simple API: /api/auth/verify-email - запрос получен');
  console.log('🔍 Simple API: Body запроса:', req.body);
  
  const { token } = req.body;
  
  if (!token) {
    console.log('❌ Simple API: Токен верификации отсутствует');
    return res.status(400).json({ 
      error: 'Токен верификации обязателен' 
    });
  }

  console.log('🔍 Simple API: Проверяю токен:', token.substring(0, 20) + '...');

  // Находим пользователя по токену
  const userEmail = getTokenEmail(token);
  
  if (!userEmail) {
    console.log('❌ Simple API: Токен верификации не найден или истек');
    return res.status(400).json({ 
      error: 'Токен верификации недействителен или истек' 
    });
  }

  // Получаем пользователя
  const user = getUser(userEmail);
  
  if (!user) {
    console.log('❌ Simple API: Пользователь не найден');
    return res.status(404).json({ 
      error: 'Пользователь не найден' 
    });
  }

  if (user.isVerified) {
    console.log('✅ Simple API: Пользователь уже подтвержден');
    return res.status(200).json({ 
      message: 'Email уже подтвержден',
      user: { username: user.username, email: user.email, isVerified: true }
    });
  }

  // Подтверждаем пользователя
  user.isVerified = true;
  user.verifiedAt = new Date().toISOString();
  
  // Сохраняем обновленного пользователя
  const userUpdated = saveUser(userEmail, user);
  
  if (!userUpdated) {
    console.error('❌ Simple API: Ошибка при обновлении пользователя');
    return res.status(500).json({ 
      error: 'Ошибка при подтверждении email' 
    });
  }
  
  // Удаляем использованный токен
  removeToken(token);
  
  console.log('✅ Simple API: Пользователь успешно подтвержден:', {
    username: user.username,
    email: user.email,
    verifiedAt: user.verifiedAt
  });

  res.json({ 
    message: 'Email успешно подтвержден! Ваш аккаунт активирован.',
    user: { 
      username: user.username, 
      email: user.email, 
      isVerified: true,
      verifiedAt: user.verifiedAt
    }
  });
});

// Get users endpoint (для отладки)
router.get('/auth/users', (req, res) => {
  console.log('🔍 Simple API: /api/auth/users - запрос получен');
  
  const usersList = getAllUsers().map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    verifiedAt: user.verifiedAt
  }));
  
  console.log('✅ Simple API: Возвращаю список пользователей:', usersList.length);
  
  res.json({ 
    users: usersList,
    total: usersList.length
  });
});

// Вход пользователя (без базы данных)
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password: password ? '***' : 'undefined' });

    if (!username || !password) {
      return res.status(400).json({ error: 'Не все поля заполнены' });
    }

    // В реальном приложении здесь бы проверяли базу данных
    // Для тестирования используем фиксированные данные
    if (username === 'testuser' && password === 'testpassword123') {
      const token = jwt.sign(
        { userId: 'test-id', username: 'testuser', email: 'test@example.com' },
        'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Вход выполнен успешно',
        token,
        user: {
          id: 'test-id',
          username: 'testuser',
          email: 'test@example.com',
          isVerified: true,
        }
      });
    } else {
      res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка при входе', details: error.message });
  }
});

console.log('✅ Simple API: Роутер успешно создан');

module.exports = { router: router };
