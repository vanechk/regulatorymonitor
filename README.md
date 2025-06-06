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
git clone https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
cd ВАШ_РЕПОЗИТОРИЙ
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env` в корне проекта:

```
DATABASE_URL="mysql://user:password@localhost:3306/taxnewsradar"
```

- Для PostgreSQL используйте:
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/taxnewsradar"
  ```

### 4. Миграции и генерация Prisma Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

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
