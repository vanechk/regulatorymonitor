# TaxNewsRadar

Система мониторинга налоговых новостей для российских специалистов и частных лиц.

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/taxnewsradar.git
cd taxnewsradar
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте базу данных:
- Установите PostgreSQL
- Создайте базу данных:
```bash
createdb taxnewsradar_test
```
- Настройте переменные окружения в файле `.env`

4. Примените миграции базы данных:
```bash
npx prisma migrate dev
```

## Запуск

### Разработка
```bash
npm run dev
```

### Тестирование
```bash
npm test
```

## Структура проекта

- `src/` - исходный код
  - `api/` - API endpoints
  - `components/` - React компоненты
  - `test/` - тесты
  - `db/` - настройки базы данных
  - `utils/` - вспомогательные функции

## Технологии

- React
- TypeScript
- Prisma
- PostgreSQL
- Jest
- React Query 