const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Генерация токена подтверждения
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Тестовый роут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simple Registration Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API роуты
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('Registration attempt:', { username, email, password: password ? '***' : 'undefined' });

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Не все поля заполнены',
        received: { username: !!username, email: !!email, password: !!password }
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Генерируем токен подтверждения
    const verificationToken = generateVerificationToken();

    console.log('User would be created with:', {
      username,
      email,
      hashedPassword: hashedPassword.substring(0, 20) + '...',
      verificationToken: verificationToken.substring(0, 10) + '...'
    });

    res.json({
      message: 'Регистрация успешна. Проверьте ваш email для подтверждения аккаунта.',
      user: {
        id: 'temp-id',
        username: username,
        email: email,
        isVerified: false,
      },
      verificationToken: verificationToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации', details: error.message });
  }
});

// Вход пользователя
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password: password ? '***' : 'undefined' });

    if (!username || !password) {
      return res.status(400).json({ error: 'Не все поля заполнены' });
    }

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

// Верификация email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Verification attempt with token:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
      return res.status(400).json({ error: 'Токен верификации обязателен' });
    }

    // В реальном приложении здесь была бы проверка токена в базе данных
    // Для тестирования мы будем считать любой токен валидным
    
    // Генерируем уникальный ID пользователя
    const userId = crypto.randomUUID();
    const username = 'verified_user_' + Date.now();
    const email = 'verified_' + Date.now() + '@example.com';
    
    console.log('User verified successfully:', { userId, username, email });

    res.json({
      message: 'Email успешно подтвержден! Ваш аккаунт активирован.',
      user: {
        id: userId,
        username: username,
        email: email,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Ошибка при подтверждении email', details: error.message });
  }
});

// Проверка статуса пользователя по токену верификации (для фронтенда)
app.post('/api/auth/check-verification-status', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Check verification status for token:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
      return res.status(400).json({ error: 'Токен верификации обязателен' });
    }

    // В реальном приложении здесь была бы проверка токена в базе данных
    // Для тестирования мы будем считать любой токен валидным
    
    // Имитируем проверку статуса
    const isVerified = Math.random() > 0.5; // Случайно определяем статус для тестирования
    
    if (isVerified) {
      console.log('User already verified');
      return res.json({
        status: 'verified',
        message: 'Email уже подтвержден. Вы можете войти в систему.',
        user: {
          id: 'verified-user-id',
          username: 'verified_user',
          email: 'verified@example.com',
          isVerified: true
        }
      });
    } else {
      console.log('User ready for verification');
      return res.json({
        status: 'pending',
        message: 'Токен действителен. Подтверждаем email...',
        user: {
          id: 'pending-user-id',
          username: 'pending_user',
          email: 'pending@example.com',
          isVerified: false
        }
      });
    }
  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Ошибка при проверке статуса верификации', 
      details: error.message 
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Simple Registration Server is running on port ${PORT}`);
  console.log(`📝 Test registration: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Test login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`✅ Test verification: POST http://localhost:${PORT}/api/auth/verify-email`);
});




