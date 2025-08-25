const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

console.log('🔍 API: Создаю API с Prisma для полноценной базы данных');

// Импортируем email функции
const { sendVerificationEmail } = require('../utils/email.js');

// Middleware для логирования всех запросов
router.use((req, res, next) => {
  console.log(`🔍 API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('🔍 API: Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('🔍 API: Body:', req.body);
  }
  next();
});

// Функция для очистки истекших токенов
async function cleanupExpiredTokens() {
  try {
    const expiredUsers = await prisma.pendingUser.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    if (expiredUsers.length > 0) {
      console.log(`🧹 API: Найдено ${expiredUsers.length} истекших токенов, удаляю...`);
      
      for (const user of expiredUsers) {
        await prisma.pendingUser.delete({ where: { id: user.id } });
        console.log(`🧹 API: Удален истекший токен для пользователя ${user.email}`);
      }
      
      console.log(`✅ API: Удалено ${expiredUsers.length} истекших токенов`);
    }
  } catch (error) {
    console.error('❌ API: Ошибка при очистке истекших токенов:', error);
  }
}

// Запускаем очистку истекших токенов каждые 6 часов
setInterval(cleanupExpiredTokens, 6 * 60 * 60 * 1000);

// Запускаем очистку при старте сервера
cleanupExpiredTokens();

// Тестовый endpoint
router.get('/test', (req, res) => {
  console.log('🔍 API: /api/test endpoint вызван');
  res.json({ 
    message: 'API с Prisma работает!', 
    timestamp: new Date().toISOString(),
    database: 'MySQL с Prisma'
  });
});

// Регистрация пользователя
router.post('/auth/register', async (req, res) => {
  console.log('🔍 API: /api/auth/register - запрос получен');
  
  const { username, email, password, firstName, lastName, region } = req.body;
  
  console.log('🔍 API: Парсинг данных:', { 
    username, 
    email, 
    password: password ? '***' : 'отсутствует',
    firstName,
    lastName,
    region
  });

  if (!username || !email || !password) {
    console.log('❌ API: Отсутствуют обязательные поля');
    return res.status(400).json({ 
      error: 'Все поля обязательны для заполнения' 
    });
  }

  try {
    // Проверяем, не существует ли уже пользователь в основной таблице
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ API: Пользователь с таким email или username уже существует в основной таблице');
      return res.status(400).json({ 
        error: 'Пользователь с таким email или username уже зарегистрирован' 
      });
    }

    // Проверяем, не существует ли уже пользователь в таблице ожидающих
    const existingPendingUser = await prisma.pendingUser.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingPendingUser) {
      console.log('❌ API: Пользователь с таким email или username уже ожидает подтверждения');
      return res.status(400).json({ 
        error: 'Пользователь с таким email или username уже зарегистрирован и ожидает подтверждения' 
      });
    }

    console.log('✅ API: Все поля заполнены, начинаю обработку');

    // Хешируем пароль
    console.log('🔍 API: Хеширую пароль...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ API: Пароль захеширован');

    // Генерируем токен верификации
    console.log('🔍 API: Генерирую токен верификации...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('✅ API: Токен верификации сгенерирован:', verificationToken.substring(0, 20) + '...');

    // Создаем пользователя в таблице ожидающих (НЕ в основной таблице)
    const pendingUser = await prisma.pendingUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        region: region || null,
        themeColor: "220 85% 45%", // Значение по умолчанию
        themeMode: "light", // Значение по умолчанию
        verificationToken: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      }
    });
    
    console.log('✅ API: Пользователь создан в таблице ожидающих:', {
      id: pendingUser.id,
      username: pendingUser.username,
      email: pendingUser.email,
      expiresAt: pendingUser.expiresAt
    });

    // Отправляем email
    console.log('🔍 API: Начинаю отправку email верификации...');
    console.log('🔍 API: Email будет отправлен на:', email);
    
    let emailSent = false;
    let emailError = null;
    
    try {
      await sendVerificationEmail(email, username, verificationToken);
      console.log(`✅ API: Email верификации успешно отправлен на ${email}`);
      emailSent = true;
      
    } catch (emailError) {
      console.error('❌ API: Ошибка при отправке email верификации:', emailError);
      console.error('❌ API: Детали ошибки email:', {
        message: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        response: emailError.response,
        command: emailError.command
      });
      
      // Пользователь остается в таблице ожидающих, даже если email не отправлен
      console.log('⚠️ API: Пользователь остается в таблице ожидающих, email не отправлен');
    }
    
    // Всегда возвращаем успех, если пользователь создан
    if (emailSent) {
      res.json({ 
        message: 'Регистрация успешна. Проверьте ваш email для подтверждения аккаунта.',
        user: { 
          id: pendingUser.id,
          username: pendingUser.username, 
          email: pendingUser.email, 
          isVerified: false,
          createdAt: pendingUser.createdAt
        },
        verificationToken,
        emailStatus: 'sent'
      });
    } else {
      res.json({ 
        message: 'Регистрация успешна! Пользователь создан в системе.',
        user: { 
          id: pendingUser.id,
          username: pendingUser.username, 
          email: pendingUser.email, 
          isVerified: false,
          createdAt: pendingUser.createdAt
        },
        verificationToken,
        emailStatus: 'not_sent',
        note: 'Email не был отправлен, но регистрация завершена успешно. Обратитесь к администратору для повторной отправки письма.'
      });
    }

  } catch (error) {
    console.error('❌ API: Общая ошибка при регистрации:', error);
    console.error('❌ API: Детали общей ошибки:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при регистрации' 
    });
  }
});

// Подтверждение email
router.post('/auth/verify-email', async (req, res) => {
  console.log('🔍 API: /api/auth/verify-email - запрос получен');
  
  const { token } = req.body;
  
  if (!token) {
    console.log('❌ API: Токен верификации отсутствует');
    return res.status(400).json({ 
      error: 'Токен верификации обязателен' 
    });
  }

  console.log('🔍 API: Проверяю токен:', token.substring(0, 20) + '...');

  try {
    // Находим пользователя в таблице ожидающих по токену
    console.log('🔍 API: Ищу временного пользователя с токеном...');
    console.log('🔍 API: Текущее время:', new Date().toISOString());
    
    const pendingUser = await prisma.pendingUser.findFirst({
      where: { 
        verificationToken: token
      }
    });
    
    console.log('🔍 API: Временный пользователь найден:', pendingUser ? 'да' : 'нет');
    if (pendingUser) {
      console.log('🔍 API: Детали временного пользователя:', {
        id: pendingUser.id,
        username: pendingUser.username,
        email: pendingUser.email,
        expiresAt: pendingUser.expiresAt
      });
    }
    
    if (!pendingUser) {
      console.log('❌ API: Временный пользователь не найден или токен истек');
      
      // Проверяем, может ли пользователь уже быть подтвержденным
      console.log('🔍 API: Токен не найден во временных пользователях, возможно пользователь уже подтвержден');
      
      // Проверяем, есть ли пользователь с таким email в основной таблице
      const existingUser = await prisma.user.findFirst({
        where: { email: 'unknown' } // Используем placeholder, так как email не передается в body
      });
      
      // Попробуем найти пользователя по токену в основной таблице
      const userWithToken = await prisma.user.findFirst({
        where: { verificationToken: token }
      });
      
      if (userWithToken && userWithToken.isVerified) {
        console.log('✅ API: Пользователь найден в основной таблице и уже подтвержден (по токену)');
        return res.json({
          message: 'Email уже подтвержден. Вы можете войти в систему.',
          info: 'Этот токен уже был использован для подтверждения. Используйте форму входа.'
        });
      }
      
      // Попробуем найти пользователя по email в основной таблице
      // Для этого нужно извлечь email из токена или использовать другой способ
      console.log('🔍 API: Пытаюсь найти пользователя по токену в основной таблице');
      
      // Если токен не найден нигде, значит он недействителен
      
      // Токен не найден или истек
      console.log('❌ API: Токен полностью недействителен или истек');
      console.log('🔍 API: Детали поиска:');
      console.log('  - Временные пользователи: не найден');
      console.log('  - Основная таблица по токену: не найден');
      console.log('  - Токен:', token.substring(0, 20) + '...');
      
      return res.status(400).json({ 
        error: 'Токен подтверждения недействителен или истек. Возможно, email уже был подтвержден ранее. Попробуйте войти в систему или зарегистрироваться снова.' 
      });
    }

    // Проверяем, не истек ли срок действия токена
    if (pendingUser.expiresAt < new Date()) {
      console.log('❌ API: Токен верификации истек');
      
      // Удаляем истекшего пользователя
      await prisma.pendingUser.delete({
        where: { id: pendingUser.id }
      });
      
      return res.status(400).json({ 
        error: 'Срок действия токена верификации истек. Зарегистрируйтесь заново.' 
      });
    }

    // Проверяем, не существует ли уже пользователь с таким email или username в основной таблице
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: pendingUser.email },
          { username: pendingUser.username }
        ]
      }
    });

    if (existingUser) {
      console.log('❌ API: Пользователь с таким email или username уже существует в основной таблице');
      
      // Удаляем дублирующегося пользователя из таблицы ожидающих
      await prisma.pendingUser.delete({
        where: { id: pendingUser.id }
      });
      
      return res.status(400).json({ 
        error: 'Пользователь с таким email или username уже зарегистрирован' 
      });
    }

    console.log('✅ API: Токен валиден, создаю пользователя в основной таблице');

    // Создаем пользователя в основной таблице
    const user = await prisma.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        region: pendingUser.region,
        themeColor: "220 85% 45%", // Значение по умолчанию
        themeMode: "light", // Значение по умолчанию
        isVerified: true,
        verificationToken: null
      }
    });
    
    console.log('✅ API: Пользователь успешно создан в основной таблице:', {
      id: user.id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified
    });

    // Удаляем пользователя из таблицы ожидающих
    await prisma.pendingUser.delete({
      where: { id: pendingUser.id }
    });
    
    console.log('✅ API: Пользователь удален из таблицы ожидающих');

    res.json({ 
      message: 'Email успешно подтвержден! Ваш аккаунт активирован.',
      user: { 
        id: user.id,
        username: user.username, 
        email: user.email, 
        isVerified: user.isVerified,
        verifiedAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ API: Ошибка при подтверждении email:', error);
    console.error('❌ API: Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Ошибка при подтверждении email' 
    });
  }
});

// Повторная отправка письма с подтверждением
router.post('/auth/resend-verification', async (req, res) => {
  console.log('🔍 API: /api/auth/resend-verification - запрос получен');
  
  try {
    const { email } = req.body;

    if (!email) {
      console.log('❌ API: Email адрес не предоставлен');
      return res.status(400).json({ error: 'Email адрес не предоставлен' });
    }

    // Ищем временного пользователя с данным email
    console.log('🔍 API: Ищу временного пользователя с email:', email);
    const pendingUser = await prisma.pendingUser.findFirst({
      where: { email }
    });

    if (!pendingUser) {
      console.log('❌ API: Временный пользователь с таким email не найден');
      return res.status(400).json({ error: 'Пользователь с таким email не найден или уже подтвержден' });
    }

    // Проверяем, не истек ли срок действия предыдущего токена
    if (pendingUser.expiresAt < new Date()) {
      console.log('❌ API: Токен истек, удаляю временного пользователя');
      // Удаляем временного пользователя с истекшим токеном
      await prisma.pendingUser.delete({ where: { id: pendingUser.id } });
      return res.status(400).json({ error: 'Срок действия токена истек. Зарегистрируйтесь снова.' });
    }

    // Генерируем новый токен
    console.log('🔍 API: Генерирую новый токен верификации');
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Обновляем токен и время истечения
    const updatedPendingUser = await prisma.pendingUser.update({
      where: { id: pendingUser.id },
      data: {
        verificationToken: newVerificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
        updatedAt: new Date()
      }
    });

    // Отправляем новый email
    try {
      await sendVerificationEmail(email, pendingUser.username, newVerificationToken);
      console.log('✅ API: Новый email с подтверждением отправлен');
      
      res.json({
        message: 'Новое письмо с подтверждением отправлено на ваш email',
        user: {
          id: updatedPendingUser.id,
          username: updatedPendingUser.username,
          email: updatedPendingUser.email,
          expiresAt: updatedPendingUser.expiresAt
        }
      });
      
    } catch (emailError) {
      console.error('❌ API: Ошибка при отправке нового email:', emailError);
      res.status(500).json({ error: 'Ошибка при отправке email с подтверждением' });
    }

  } catch (error) {
    console.error('❌ API: Ошибка при повторной отправке письма:', error);
    res.status(500).json({ 
      error: 'Ошибка при повторной отправке письма', 
      details: error.message 
    });
  }
});

// Получение списка пользователей (для отладки)
router.get('/auth/users', async (req, res) => {
  console.log('🔍 API: /api/auth/users - запрос получен');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        region: true,
        themeColor: true,
        themeMode: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('✅ API: Возвращаю список пользователей из основной таблицы:', users.length);
    
    res.json({ 
      users: users,
      total: users.length
    });
  } catch (error) {
    console.error('❌ API: Ошибка при получении пользователей:', error);
    res.status(500).json({ 
      error: 'Ошибка при получении списка пользователей' 
    });
  }
});

// Получение списка пользователей в ожидании (для отладки)
router.get('/auth/pending-users', async (req, res) => {
  console.log('🔍 API: /api/auth/pending-users - запрос получен');
  
  try {
    const pendingUsers = await prisma.pendingUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        region: true,
        themeColor: true,
        themeMode: true,
        verificationToken: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('✅ API: Возвращаю список пользователей в ожидании:', pendingUsers.length);
    
    res.json({ 
      pendingUsers: pendingUsers,
      total: pendingUsers.length
    });
  } catch (error) {
    console.error('❌ API: Ошибка при получении пользователей в ожидании:', error);
    res.status(500).json({ 
      error: 'Ошибка при получении списка пользователей в ожидании' 
    });
  }
});

// Вход в систему
router.post('/auth/login', async (req, res) => {
  console.log('🔍 API: /api/auth/login - запрос получен');
  
  const { email, username, password } = req.body;
  
  // Проверяем, что передан либо email, либо username, и пароль
  if ((!email && !username) || !password) {
    return res.status(400).json({ 
      error: 'Необходимо указать email или имя пользователя, а также пароль' 
    });
  }

  try {
    // Находим пользователя по email или username
    let user;
    let searchBy = '';
    
    if (email) {
      searchBy = 'email';
      user = await prisma.user.findUnique({
        where: { email }
      });
    } else {
      searchBy = 'username';
      user = await prisma.user.findUnique({
        where: { username }
      });
    }
    
    console.log(`🔍 API: Ищу пользователя по ${searchBy}: ${email || username}`);

    if (!user) {
      return res.status(401).json({ 
        error: 'Неверный email/имя пользователя или пароль' 
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({ 
        error: 'Email не подтвержден. Проверьте ваш email для подтверждения аккаунта.' 
      });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Неверный email/имя пользователя или пароль' 
      });
    }

    // Обновляем время последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    });

  } catch (error) {
    console.error('❌ API: Ошибка при входе:', error);
    res.status(500).json({ 
      error: 'Ошибка при входе в систему' 
    });
  }
});

// Получение профиля пользователя
router.get('/auth/profile', async (req, res) => {
  console.log('🔍 API: /api/auth/profile - запрос получен');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Токен авторизации отсутствует' 
    });
  }

  const token = authHeader.substring(7);

  try {
    // Проверяем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        region: true,
        themeColor: true,
        themeMode: true,
        role: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Пользователь не найден' 
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('❌ API: Ошибка при получении профиля:', error);
    res.status(401).json({ 
      error: 'Недействительный токен' 
    });
  }
});

// Проверка статуса пользователя по токену верификации (для фронтенда)
router.post('/auth/check-verification-status', async (req, res) => {
  console.log('🔍 API: /api/auth/check-verification-status - запрос получен');
  
  const { token } = req.body;
  
  if (!token) {
    console.log('❌ API: Токен верификации отсутствует');
    return res.status(400).json({ 
      error: 'Токен верификации обязателен' 
    });
  }

  console.log('🔍 API: Проверяю статус для токена:', token.substring(0, 20) + '...');

  try {
    // Сначала проверяем в основной таблице пользователей
    const verifiedUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { verificationToken: token },
          // Можно добавить другие способы поиска
        ]
      }
    });

    if (verifiedUser && verifiedUser.isVerified) {
      console.log('✅ API: Пользователь уже подтвержден в основной таблице');
      return res.json({
        status: 'verified',
        message: 'Email уже подтвержден. Вы можете войти в систему.',
        user: {
          id: verifiedUser.id,
          username: verifiedUser.username,
          email: verifiedUser.email,
          isVerified: true
        }
      });
    }

    // Проверяем во временной таблице
    const pendingUser = await prisma.pendingUser.findFirst({
      where: {
        verificationToken: token,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (pendingUser) {
      console.log('✅ API: Пользователь найден во временной таблице, готов к подтверждению');
      return res.json({
        status: 'pending',
        message: 'Токен действителен. Подтверждаем email...',
        user: {
          id: pendingUser.id,
          username: pendingUser.username,
          email: pendingUser.email,
          isVerified: false
        }
      });
    }

    // Токен не найден или истек
    console.log('❌ API: Токен не найден или истек');
    return res.status(400).json({
      status: 'invalid',
      error: 'Токен подтверждения недействителен или истек'
    });

  } catch (error) {
    console.error('❌ API: Ошибка при проверке статуса верификации:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Ошибка при проверке статуса верификации', 
      details: error.message 
    });
  }
});

console.log('✅ API: API с Prisma создан');

// Логируем экспорт для отладки
console.log('🔍 API: router объект:', router);
console.log('🔍 API: router.use функция:', typeof router.use);
console.log('🔍 API: router.post функция:', typeof router.post);
console.log('🔍 API: router.get функция:', typeof router.get);

module.exports = { apiRouter: router };

