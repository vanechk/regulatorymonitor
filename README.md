# TaxNewsRadar

Система мониторинга налоговых новостей и документов.

## Возможности
- Мониторинг новостей из разных источников (веб-сайты, Telegram)
- Ключевые слова и фильтрация
- Экспорт в Excel
- Email-уведомления и отчёты
- Современный интерфейс на React + Tailwind CSS

---

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone git@github.com:vanechk/regulatorymonitor.git
cd regulatorymonitor
```

### 2. Установка зависимостей
```bash
npm install
```
Возможно потребуется установка node js
https://nodejs.org/en

Если не получится установить через сайт, то пишите в deepseek coder, он выдаст необходимые команды

### 3. Настройка переменных окружения
Создайте файл `.env` в корне проекта:

```
DATABASE_URL="mysql://user:password@localhost:3306/taxnewsradar"
```

До выполнения этой команды необходимо установить mysql базу
Нужно будет установить mysql, задать пароль и создать новую базу данных, для установки может потребоваться vpn
# Руководство по установке MySQL

## Установка на Windows

### 1. Скачивание установщика
1. Перейдите на официальный сайт MySQL: https://dev.mysql.com/downloads/installer/
2. Скачайте "MySQL Installer for Windows"
3. Выберите версию "Windows (x86, 32-bit), MSI Installer"

### 2. Процесс установки
1. Запустите скачанный установщик
2. Выберите тип установки:
   - "Developer Default" - для разработчиков (включает MySQL Workbench)
   - "Server only" - только сервер MySQL
3. Следуйте инструкциям установщика:
   - Установите пароль для root пользователя
   - Настройте сервер как службу Windows
   - Выберите порт (по умолчанию 3306)

### 3. Проверка установки
1. Откройте командную строку
2. Введите команду:
   ```bash
   mysql -u root -p
   ```
3. Введите установленный пароль

## Установка на macOS

### 1. Установка через Homebrew
1. Если Homebrew не установлен, установите его:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Установите MySQL:
   ```bash
   brew install mysql
   ```

### 2. Запуск и настройка
1. Запустите MySQL сервер:
   ```bash
   brew services start mysql
   ```

2. Установите пароль для root пользователя:
   ```bash
   mysql_secure_installation
   ```

### 3. Проверка установки
1. Откройте терминал
2. Введите команду:
   ```bash
   mysql -u root -p
   ```
3. Введите установленный пароль

## Дополнительные инструменты

### MySQL Workbench
- **Windows**: Устанавливается автоматически при выборе "Developer Default"
- **macOS**: Установите через Homebrew:
  ```bash
  brew install --cask mysqlworkbench
  ```

## Полезные команды

### Запуск/остановка сервера
- **Windows**: 
  - Запуск: `net start mysql`
  - Остановка: `net stop mysql`

- **macOS**:
  - Запуск: `brew services start mysql`
  - Остановка: `brew services stop mysql`

### Проверка статуса
- **Windows**: `sc query mysql`
- **macOS**: `brew services list`

## Устранение неполадок

### Общие проблемы
1. Если сервер не запускается:
   - Проверьте логи ошибок
   - Убедитесь, что порт 3306 не занят
   - Проверьте права доступа

2. Если не удается подключиться:
   - Проверьте правильность пароля
   - Убедитесь, что сервер запущен
   - Проверьте настройки брандмауэра

### Полезные ресурсы
- [Официальная документация MySQL](https://dev.mysql.com/doc/)
- [Форум поддержки MySQL](https://forums.mysql.com/)

Если не получится установить через сайт, то пишите в deepseek coder, он выдаст необходимые команды

### 4. Миграции и генерация Prisma Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```
Если база данных установлена, то с этим шагом проблем быть не должно

### 5. Запуск проекта
```bash
npm run dev
```
- Откроется клиент: http://localhost:5173
- Сервер API: http://localhost:3000

### 6. Работа с базой данных
Для ручного добавления/редактирования данных используйте Prisma Studio:
```bash
npx prisma studio
```

---

## Структура проекта
- `src/client` — фронтенд (React, Vite, Tailwind)
- `src/server` — серверная логика (Express, Prisma)
- `prisma/schema.prisma` — схема базы данных
- `src/routes/api.ts` — основные API-роуты

---

## Важно
- Не забудьте добавить `.env` и `node_modules/` в `.gitignore`.
- Для работы с MySQL/PostgreSQL база данных должна быть создана заранее.
- Для тестовых данных используйте POST-запросы к API или Prisma Studio.

---

## Контакты
Если возникли вопросы — пишите! 
