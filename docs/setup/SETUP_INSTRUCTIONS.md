# 🚀 Инструкции по настройке TaxNewsRadar

## 📋 Содержание

1. [Настройка переменных окружения](#настройка-переменных-окружения)
2. [Настройка базы данных](#настройка-базы-данных)
3. [Настройка SMTP для отправки email](#настройка-smtp-для-отправки-email)
4. [Настройка Telegram бота](#настройка-telegram-бота)
5. [Запуск системы](#запуск-системы)
6. [Тестирование](#тестирование)

---

## 🔧 Настройка переменных окружения

Создайте файл `.env` в корневой директории проекта:

```bash
# База данных
DATABASE_URL="mysql://username:password@localhost:3306/taxnewsradar"

# JWT токены (генерируйте случайные строки длиной минимум 32 символа)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-here-make-it-long-and-random-32-chars"

# SMTP настройки (для отправки email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE=true

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token-here"

# Настройки безопасности
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Настройки приложения
NODE_ENV="development"
PORT=3000
CLIENT_URL="http://localhost:5173"

# Логирование
LOG_LEVEL="info"
LOG_FILE="logs/app.log"
```

### 🔑 Генерация JWT секретов

Для генерации безопасных JWT секретов используйте:

```bash
# В терминале
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Настройка базы данных

### 1. Установка MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS
brew install mysql

# Windows
# Скачайте MySQL Installer с официального сайта
```

### 2. Создание базы данных

```sql
CREATE DATABASE taxnewsradar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taxnewsradar_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON taxnewsradar.* TO 'taxnewsradar_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Применение миграций

```bash
# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate deploy

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

---

## 📧 Настройка SMTP для отправки email

### 1. Gmail (рекомендуется для разработки)

#### Шаг 1: Включение двухфакторной аутентификации
1. Перейдите в [Настройки безопасности Google](https://myaccount.google.com/security)
2. Включите двухфакторную аутентификацию

#### Шаг 2: Создание пароля приложения
1. В настройках безопасности найдите "Пароли приложений"
2. Создайте новый пароль для "Почта"
3. Скопируйте сгенерированный пароль

#### Шаг 3: Настройка переменных окружения
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"  # Пароль приложения, не обычный пароль
SMTP_SECURE=true
```

### 2. Yandex

```bash
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=465
SMTP_USER="your-email@yandex.ru"
SMTP_PASS="your-app-password"
SMTP_SECURE=true
```

### 3. Mail.ru

```bash
SMTP_HOST="smtp.mail.ru"
SMTP_PORT=465
SMTP_USER="your-email@mail.ru"
SMTP_PASS="your-app-password"
SMTP_SECURE=true
```

### 4. Настройка через админ-панель

После запуска системы администратор может настроить глобальные SMTP настройки через БД:

```sql
INSERT INTO system_settings (id, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure) 
VALUES ('main', 'smtp.gmail.com', 587, 'your-email@gmail.com', 'your-app-password', true);
```

---

## 🤖 Настройка Telegram бота

### 1. Создание бота

#### Шаг 1: Найти @BotFather
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте команду `/newbot`

#### Шаг 2: Настройка бота
1. Введите имя бота (например, "TaxNewsRadar Bot")
2. Введите username бота (должен заканчиваться на "bot", например "taxnewsradar_bot")
3. Скопируйте полученный токен

#### Шаг 3: Настройка переменных окружения
```bash
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### 2. Получение Chat ID

#### Метод 1: Через @userinfobot
1. Найдите @userinfobot
2. Отправьте любое сообщение
3. Скопируйте ваш Chat ID

#### Метод 2: Через API
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
```

### 3. Тестирование бота

```bash
# Отправка тестового сообщения
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "Тестовое сообщение от TaxNewsRadar!"
  }'
```

---

## 🚀 Запуск системы

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate deploy
```

### 3. Запуск в режиме разработки

```bash
# Запуск сервера и клиента одновременно
npm run dev

# Или по отдельности:
npm run dev:server  # Сервер на порту 3000
npm run dev:client  # Клиент на порту 5173
```

### 4. Запуск в продакшене

```bash
# Сборка клиента
npm run build

# Запуск сервера
npm start
```

---

## 🧪 Тестирование

### 1. Тестирование авторизации

```bash
# Регистрация пользователя
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Вход в систему
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

### 2. Тестирование SMTP

```bash
# Отправка тестового email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "email": "test@example.com"
  }'
```

### 3. Тестирование Telegram

```bash
# Отправка тестового сообщения
curl -X POST http://localhost:3000/api/telegram/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "chatId": "<YOUR_CHAT_ID>"
  }'
```

---

## 🔒 Безопасность

### 1. JWT токены
- Access токены истекают через 15 минут
- Refresh токены истекают через 7 дней
- Все токены хранятся в БД для возможности отзыва

### 2. Защита от брутфорса
- Максимум 5 неудачных попыток входа
- Блокировка аккаунта на 15 минут после превышения лимита
- Счетчик попыток сбрасывается при успешном входе

### 3. Валидация данных
- Все входные данные валидируются через Zod схемы
- Санитизация строковых полей
- Защита от SQL инъекций через Prisma

---

## 📝 Логирование

### 1. Действия пользователей
Все действия пользователей логируются в таблицу `user_actions`:
- Вход/выход из системы
- Изменение профиля
- Отправка email/telegram сообщений
- Ошибки при отправке

### 2. Просмотр логов

```sql
-- Последние действия пользователя
SELECT * FROM user_actions 
WHERE userId = 'user_id' 
ORDER BY createdAt DESC 
LIMIT 10;

-- Ошибки отправки email
SELECT * FROM user_actions 
WHERE action = 'EMAIL_ERROR' 
ORDER BY createdAt DESC;
```

---

## 🆘 Устранение неполадок

### 1. Ошибки SMTP

**Ошибка: "Authentication failed"**
- Проверьте правильность email и пароля
- Убедитесь, что используете пароль приложения для Gmail
- Проверьте, включена ли двухфакторная аутентификация

**Ошибка: "Connection timeout"**
- Проверьте правильность SMTP_HOST и SMTP_PORT
- Убедитесь, что порт не заблокирован файрволом
- Попробуйте использовать другой SMTP сервер

### 2. Ошибки Telegram

**Ошибка: "Unauthorized"**
- Проверьте правильность TELEGRAM_BOT_TOKEN
- Убедитесь, что бот не заблокирован
- Проверьте, что бот добавлен в чат

**Ошибка: "Chat not found"**
- Проверьте правильность Chat ID
- Убедитесь, что бот добавлен в чат
- Попробуйте отправить сообщение боту вручную

### 3. Ошибки базы данных

**Ошибка: "Connection refused"**
- Проверьте, что MySQL сервер запущен
- Проверьте правильность DATABASE_URL
- Убедитесь, что пользователь имеет права доступа

---

## 📚 Дополнительные ресурсы

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [JWT.io](https://jwt.io/)
- [Zod Documentation](https://zod.dev/)

---

## 🤝 Поддержка

Если у вас возникли проблемы или вопросы:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте подключение к базе данных
4. Создайте issue в репозитории проекта

Удачи в настройке TaxNewsRadar! 🎉
