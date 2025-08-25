# Настройка Email для регистрации аккаунта

## 📧 Проблема

После отката изменений email для регистрации перестал работать. Это произошло потому, что:

1. **TypeScript API** использует `EmailService` из `src/server/utils/email.ts`
2. **JavaScript API** использует `simple-api.js` с жестко закодированными SMTP настройками
3. **Основной сервер** запускает TypeScript API, но email верификации не настроен

## 🔧 Решение

### Шаг 1: Создание файла .env

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-here-change-this-in-production"

# SMTP Configuration (выберите один из вариантов)
EMAIL_HOST="smtp.mail.ru"
EMAIL_PORT=465
EMAIL_USER="your-email@mail.ru"
EMAIL_PASS="your-app-password"
EMAIL_FROM="your-email@mail.ru"

# Server Configuration
NODE_ENV="development"
PORT=3000
```

### Шаг 2: Настройка SMTP провайдера

#### Mail.ru (рекомендуется для России)
1. Создайте приложение в [Mail.ru для разработчиков](https://api.mail.ru/)
2. Получите пароль приложения (не основной пароль!)
3. Настройки:
   ```env
   EMAIL_HOST=smtp.mail.ru
   EMAIL_PORT=465
   EMAIL_USER=your-email@mail.ru
   EMAIL_PASS=your-app-password
   ```

#### Gmail
1. Включите двухфакторную аутентификацию
2. Создайте пароль приложения
3. Настройки:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### Шаг 3: Перезапуск сервера

```bash
npm run dev:server
```

## 🚀 Что исправлено

1. **Добавлен метод `sendVerificationEmail`** в TypeScript `EmailService`
2. **Обновлен endpoint регистрации** для реальной отправки email
3. **Email верификации** теперь отправляется через TypeScript API

## 📋 Как это работает

1. **Пользователь регистрируется** → `POST /api/auth/register`
2. **Создается pending пользователь** в базе данных
3. **Генерируется токен верификации**
4. **Отправляется email** с красивым HTML шаблоном
5. **Пользователь подтверждает email** → `POST /api/auth/verify-email`
6. **Создается активный пользователь**

## 🔍 Тестирование

1. **Создайте файл `.env`** с правильными SMTP настройками
2. **Перезапустите сервер** (`npm run dev:server`)
3. **Зарегистрируйтесь** с реальным email
4. **Проверьте почту** - должно прийти письмо с подтверждением
5. **Нажмите на ссылку** - должна открыться страница подтверждения

## 📱 HTML шаблон

Система автоматически генерирует красивый HTML email с:
- Логотипом TaxNewsRadar
- Персонализированным приветствием
- Кнопкой подтверждения
- Резервной ссылкой
- Информацией о сроке действия

## ⚠️ Важные моменты

1. **Используйте пароль приложения**, а не основной пароль email
2. **Порт 465** обычно использует SSL, **порт 587** - TLS
3. **Проверьте настройки безопасности** email провайдера
4. **В режиме разработки** email отправляется на реальные адреса

## 🎯 Результат

После настройки:
- ✅ Email верификации будет отправляться автоматически
- ✅ Красивые HTML письма с брендингом TaxNewsRadar
- ✅ Надежная система подтверждения аккаунтов
- ✅ Логирование всех email операций

---

**Примечание:** Если email все еще не отправляется, проверьте консоль сервера на наличие ошибок SMTP.



