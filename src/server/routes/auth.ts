import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { JWTService } from '../utils/jwt';
import { 
  userRegistrationSchema, 
  userLoginSchema, 
  userProfileUpdateSchema, 
  passwordChangeSchema,
  validateData,
  validatePartialData
} from '../utils/validation';
import { authMiddleware, requireRole, logUserAction } from '../middleware/auth';
import { sanitizeString } from '../utils/validation';
import { EmailService } from '../utils/email';

const router = express.Router();

console.log('🔍 Auth: Создаю auth router...');
console.log('🔍 Auth: Регистрирую эндпоинты...');

// Регистрация пользователя
router.post('/register', logUserAction('USER_REGISTRATION'), async (req, res) => {
  try {
    // Валидация данных
    const validation = validateData(userRegistrationSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.errors
      });
    }

    const { username, email, password, firstName, lastName, region } = validation.data;

    // Проверяем, не существует ли уже пользователь
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: sanitizeString(username) },
          { email: sanitizeString(email) }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Пользователь с таким именем или email уже существует',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Проверяем, нет ли уже pending пользователя
    const existingPendingUser = await db.pendingUser.findFirst({
      where: {
        OR: [
          { username: sanitizeString(username) },
          { email: sanitizeString(email) }
        ]
      }
    });

    if (existingPendingUser) {
      return res.status(409).json({
        error: 'Заявка на регистрацию уже подана. Проверьте email для подтверждения.',
        code: 'PENDING_REGISTRATION_EXISTS'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем токен верификации
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    // Создаем pending пользователя
    const pendingUser = await db.pendingUser.create({
      data: {
        username: sanitizeString(username),
        email: sanitizeString(email),
        password: hashedPassword,
        firstName: firstName ? sanitizeString(firstName) : null,
        lastName: lastName ? sanitizeString(lastName) : null,
        region: region ? sanitizeString(region) : null,
        verificationToken,
        expiresAt
      }
    });

    // Отправляем email с токеном верификации
    try {
      await EmailService.sendVerificationEmail(email, username, verificationToken);
      console.log(`✅ Email верификации отправлен на ${email}`);
    } catch (emailError) {
      console.error('❌ Ошибка при отправке email верификации:', emailError);
      // Не прерываем регистрацию, если email не отправился
      // Пользователь может запросить повторную отправку
    }

    res.status(201).json({
      message: 'Регистрация успешна. Проверьте email для подтверждения аккаунта.',
      userId: pendingUser.id
    });

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({
      error: 'Ошибка при регистрации',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Подтверждение email
router.post('/verify-email', logUserAction('EMAIL_VERIFICATION'), async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Токен верификации обязателен',
        code: 'MISSING_VERIFICATION_TOKEN'
      });
    }

    // Находим pending пользователя
    const pendingUser = await db.pendingUser.findUnique({
      where: { verificationToken: token }
    });

    if (!pendingUser) {
      // Проверяем, может ли пользователь уже быть подтвержденным
      // Ищем пользователя по токену в основной таблице
      const existingUser = await db.user.findFirst({
        where: { verificationToken: token }
      });
      
      if (existingUser && existingUser.isVerified) {
        return res.json({
          message: 'Email уже подтвержден. Вы можете войти в систему.',
          info: 'Этот токен уже был использован для подтверждения. Если у вас есть аккаунт, используйте форму входа.',
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            isVerified: true
          }
        });
      }
      
      // Если пользователь не найден по токену, проверяем по email
      // Возможно, токен был изменен или удален, но пользователь уже подтвержден
      const pendingUserByEmail = await db.pendingUser.findFirst({
        where: { verificationToken: token }
      });
      
      if (pendingUserByEmail) {
        const existingVerifiedUser = await db.user.findFirst({
          where: { 
            email: pendingUserByEmail.email,
            isVerified: true
          }
        });
        
        if (existingVerifiedUser) {
          return res.json({
            message: 'Email уже подтвержден. Вы можете войти в систему.',
            info: 'Этот токен уже был использован для подтверждения. Если у вас есть аккаунт, используйте форму входа.',
            user: {
              id: existingVerifiedUser.id,
              username: existingVerifiedUser.username,
              email: existingVerifiedUser.email,
              isVerified: true
            }
          });
        }
      }
      
      return res.status(400).json({
        error: 'Недействительный токен верификации',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    if (pendingUser.expiresAt < new Date()) {
      // Удаляем истекшего pending пользователя
      await db.pendingUser.delete({
        where: { id: pendingUser.id }
      });

      return res.status(400).json({
        error: 'Токен верификации истек. Зарегистрируйтесь заново.',
        code: 'VERIFICATION_TOKEN_EXPIRED'
      });
    }

    // Создаем основного пользователя
    const user = await db.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        region: pendingUser.region,
        themeColor: pendingUser.themeColor,
        themeMode: pendingUser.themeMode,
        isVerified: true,
        verificationToken: pendingUser.verificationToken, // Сохраняем токен верификации
        role: 'USER'
      }
    });

    // Создаем настройки email и telegram для пользователя
    await db.emailSettings.create({
      data: {
        userId: user.id,
        email: user.email,
        isEnabled: false,
        summaryFrequency: 'DAILY'
      }
    });

    await db.telegramSettings.create({
      data: {
        userId: user.id,
        isEnabled: false,
        summaryFrequency: 'DAILY'
      }
    });

    // Удаляем pending пользователя
    await db.pendingUser.delete({
      where: { id: pendingUser.id }
    });

    res.json({
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему.',
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Ошибка при подтверждении email:', error);
    res.status(500).json({
      error: 'Ошибка при подтверждении email',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Проверка статуса пользователя по токену верификации (для фронтенда)
router.post('/check-verification-status', logUserAction('CHECK_VERIFICATION_STATUS'), async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Токен верификации обязателен',
        code: 'MISSING_VERIFICATION_TOKEN'
      });
    }

    // Сначала проверяем в основной таблице пользователей по токену
    const verifiedUser = await db.user.findFirst({
      where: { verificationToken: token }
    });

    // Если пользователь уже есть в базе данных и подтвержден - возвращаем успех
    if (verifiedUser && verifiedUser.isVerified) {
      return res.json({
        status: 'success',
        message: 'Email уже подтвержден. Вы можете войти в систему.',
        user: {
          id: verifiedUser.id,
          username: verifiedUser.username,
          email: verifiedUser.email,
          isVerified: true
        }
      });
    }

    // Если пользователь не найден по токену, но есть в pending таблице,
    // возможно он уже был подтвержден, но токен не сохранился
    // Проверяем по email в основной таблице
    if (!verifiedUser) {
      const pendingUser = await db.pendingUser.findUnique({
        where: { verificationToken: token }
      });
      
      if (pendingUser) {
        // Проверяем, есть ли уже подтвержденный пользователь с таким email
        const existingVerifiedUser = await db.user.findFirst({
          where: { 
            email: pendingUser.email,
            isVerified: true
          }
        });
        
        if (existingVerifiedUser) {
          return res.json({
            status: 'success',
            message: 'Email уже подтвержден. Вы можете войти в систему.',
            user: {
              id: existingVerifiedUser.id,
              username: existingVerifiedUser.username,
              email: existingVerifiedUser.email,
              isVerified: true
            }
          });
        }
      }
    }

    // Проверяем во временной таблице
    const pendingUser = await db.pendingUser.findUnique({
      where: { verificationToken: token }
    });

    if (pendingUser) {
      // Проверяем, не истек ли токен
      if (pendingUser.expiresAt < new Date()) {
        return res.status(400).json({
          status: 'expired',
          error: 'Токен верификации истек'
        });
      }

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

    // Токен не найден
    return res.status(400).json({
      status: 'invalid',
      error: 'Токен подтверждения недействителен'
    });

  } catch (error) {
    console.error('Ошибка при проверке статуса верификации:', error);
    res.status(500).json({
      status: 'error',
      error: 'Ошибка при проверке статуса верификации',
      code: 'CHECK_STATUS_ERROR'
    });
  }
});

// Повторная отправка токена верификации
router.post('/resend-verification', logUserAction('RESEND_VERIFICATION'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email обязателен',
        code: 'MISSING_EMAIL'
      });
    }

    // Находим pending пользователя
    const pendingUser = await db.pendingUser.findUnique({
      where: { email: sanitizeString(email) }
    });

    if (!pendingUser) {
      return res.status(404).json({
        error: 'Заявка на регистрацию не найдена',
        code: 'PENDING_USER_NOT_FOUND'
      });
    }

    // Генерируем новый токен
    const newVerificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    // Обновляем токен
    await db.pendingUser.update({
      where: { id: pendingUser.id },
      data: {
        verificationToken: newVerificationToken,
        expiresAt: newExpiresAt
      }
    });

    // Отправляем email с новым токеном
    try {
      await EmailService.sendVerificationEmail(email, pendingUser.username, newVerificationToken);
      console.log(`✅ Email верификации отправлен на ${email}`);
    } catch (emailError) {
      console.error('❌ Ошибка при отправке email верификации:', emailError);
      // Не прерываем повторную отправку
    }

    res.json({
      message: 'Новый токен верификации отправлен на email'
    });

  } catch (error) {
    console.error('Ошибка при повторной отправке токена:', error);
    res.status(500).json({
      error: 'Ошибка при повторной отправке токена',
      code: 'RESEND_ERROR'
    });
  }
});

// Вход в систему
router.post('/login', logUserAction('USER_LOGIN'), async (req, res) => {
  try {
    console.log('🔍 Auth: Попытка входа с данными:', { 
      body: req.body,
      contentType: req.get('Content-Type'),
      userAgent: req.get('User-Agent')
    });
    
    // Валидация данных
    const validation = validateData(userLoginSchema, req.body);
    console.log('🔍 Auth: Результат валидации:', validation);
    
    if (!validation.success) {
      console.log('❌ Auth: Ошибка валидации:', validation.errors);
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.errors
      });
    }

    // Извлекаем данные из валидированного объекта
    const loginData = validation.data;
    const username = 'username' in loginData ? loginData.username : loginData.email;
    const password = loginData.password;
    
    console.log('🔍 Auth: Извлеченные данные:', { username, passwordLength: password?.length });

    // Определяем, что передано: email или username
    const isEmail = username.includes('@');
    const searchField = isEmail ? 'email' : 'username';
    
    console.log('🔍 Auth: Поиск по полю:', searchField);

    // Находим пользователя
    const user = await db.user.findFirst({
      where: {
        [searchField]: sanitizeString(username)
      }
    });
    
    console.log('🔍 Auth: Результат поиска пользователя:', user ? { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified } : 'не найден');

    if (!user) {
      console.log('❌ Auth: Пользователь не найден');
      return res.status(401).json({
        error: 'Неверное имя пользователя или пароль',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Проверяем статус пользователя
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Аккаунт заблокирован или приостановлен',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Проверяем, не заблокирован ли аккаунт
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Аккаунт временно заблокирован из-за множественных неудачных попыток входа',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Увеличиваем счетчик неудачных попыток
      const newLoginAttempts = user.loginAttempts + 1;
      const maxAttempts = 5; // TODO: Получать из системных настроек
      const lockoutDuration = 15; // TODO: Получать из системных настроек

      if (newLoginAttempts >= maxAttempts) {
        // Блокируем аккаунт
        const lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
        
        await db.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newLoginAttempts,
            lockedUntil
          }
        });

        return res.status(423).json({
          error: `Аккаунт заблокирован на ${lockoutDuration} минут из-за множественных неудачных попыток входа`,
          code: 'ACCOUNT_LOCKED',
          lockedUntil
        });
      }

      // Обновляем счетчик неудачных попыток
      await db.user.update({
        where: { id: user.id },
        data: { loginAttempts: newLoginAttempts }
      });

      return res.status(401).json({
        error: 'Неверное имя пользователя или пароль',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: maxAttempts - newLoginAttempts
      });
    }

    // Сбрасываем счетчик неудачных попыток и обновляем время последнего входа
    await db.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Генерируем токены
    const tokens = JWTService.generateTokenPair(
      user.id,
      user.username,
      user.email,
      user.role
    );

    // Сохраняем refresh токен в БД
    await db.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
      }
    });

    // Логируем успешный вход
    await db.userAction.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: JSON.stringify({
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        region: user.region,
        themeColor: user.themeColor,
        themeMode: user.themeMode,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens
    });

  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({
      error: 'Ошибка при входе в систему',
      code: 'LOGIN_ERROR'
    });
  }
});

// Обновление токенов
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh токен обязателен',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Проверяем refresh токен
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Находим токен в БД
    const storedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Недействительный refresh токен',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Генерируем новую пару токенов
    const newTokens = JWTService.generateTokenPair(
      storedToken.user.id,
      storedToken.user.username,
      storedToken.user.email,
      storedToken.user.role
    );

    // Отзываем старый refresh токен
    await db.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true }
    });

    // Сохраняем новый refresh токен
    await db.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
      }
    });

    res.json({
      message: 'Токены обновлены',
      tokens: newTokens
    });

  } catch (error) {
    console.error('Ошибка при обновлении токенов:', error);
    res.status(401).json({
      error: 'Недействительный refresh токен',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Выход из системы
router.post('/logout', authMiddleware, logUserAction('USER_LOGOUT'), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Отзываем refresh токен
      await db.refreshToken.updateMany({
        where: { 
          token: refreshToken,
          userId: req.user!.id
        },
        data: { isRevoked: true }
      });
    }

    // Логируем выход
    await db.userAction.create({
      data: {
        userId: req.user!.id,
        action: 'LOGOUT',
        details: JSON.stringify({
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Выход выполнен успешно'
    });

  } catch (error) {
    console.error('Ошибка при выходе:', error);
    res.status(500).json({
      error: 'Ошибка при выходе из системы',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Получение профиля пользователя
router.get('/profile', authMiddleware, logUserAction('GET_PROFILE'), async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
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
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(user);

  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({
      error: 'Ошибка при получении профиля',
      code: 'PROFILE_ERROR'
    });
  }
});

// Обновление профиля пользователя
console.log('🔍 Auth: Регистрирую PUT /profile эндпоинт');
router.put('/profile', authMiddleware, logUserAction('UPDATE_PROFILE'), async (req, res) => {
  try {
    // Валидация данных
    const validation = validatePartialData(userProfileUpdateSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.errors
      });
    }

    const updateData = validation.data;

    // Санитизируем строковые поля
    if (updateData.firstName) updateData.firstName = sanitizeString(updateData.firstName);
    if (updateData.lastName) updateData.lastName = sanitizeString(updateData.lastName);
    if (updateData.region) updateData.region = sanitizeString(updateData.region);

    // Обновляем профиль
    const updatedUser = await db.user.update({
      where: { id: req.user!.id },
      data: updateData,
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
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Профиль обновлен успешно',
      user: updatedUser
    });

  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({
      error: 'Ошибка при обновлении профиля',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Изменение пароля
router.put('/change-password', authMiddleware, logUserAction('CHANGE_PASSWORD'), async (req, res) => {
  try {
    // Валидация данных
    const validation = validateData(passwordChangeSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: validation.errors
      });
    }

    const { currentPassword, newPassword } = validation.data;

    // Получаем текущий пароль пользователя
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
        code: 'USER_NOT_FOUND'
      });
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Неверный текущий пароль',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль
    await db.user.update({
      where: { id: req.user!.id },
      data: { password: hashedNewPassword }
    });

    // Отзываем все refresh токены пользователя
    await db.refreshToken.updateMany({
      where: { userId: req.user!.id },
      data: { isRevoked: true }
    });

    res.json({
      message: 'Пароль успешно изменен. Необходимо войти заново.'
    });

  } catch (error) {
    console.error('Ошибка при изменении пароля:', error);
    res.status(500).json({
      error: 'Ошибка при изменении пароля',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Удаление аккаунта
router.delete('/account', authMiddleware, logUserAction('DELETE_ACCOUNT'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Пароль обязателен для подтверждения',
        code: 'MISSING_PASSWORD'
      });
    }

    // Получаем текущий пароль пользователя
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
        code: 'USER_NOT_FOUND'
      });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Неверный пароль',
        code: 'INVALID_PASSWORD'
      });
    }

    // Удаляем пользователя (каскадное удаление удалит все связанные данные)
    await db.user.delete({
      where: { id: req.user!.id }
    });

    res.json({
      message: 'Аккаунт успешно удален'
    });

  } catch (error) {
    console.error('Ошибка при удалении аккаунта:', error);
    res.status(500).json({
      error: 'Ошибка при удалении аккаунта',
      code: 'ACCOUNT_DELETION_ERROR'
    });
  }
});

// Получение истории действий пользователя (только для админов)
router.get('/actions', authMiddleware, requireRole('ADMIN'), logUserAction('GET_USER_ACTIONS'), async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, dateFrom, dateTo } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [actions, total] = await Promise.all([
      db.userAction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      db.userAction.count({ where })
    ]);

    res.json({
      actions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Ошибка при получении истории действий:', error);
    res.status(500).json({
      error: 'Ошибка при получении истории действий',
      code: 'ACTIONS_ERROR'
    });
  }
});

console.log('🔍 Auth: Auth router создан, экспортирую...');
export default router;
