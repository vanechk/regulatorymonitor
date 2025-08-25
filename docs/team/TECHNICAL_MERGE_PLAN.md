# 🔧 Технический план мержа веток

## 📊 Анализ текущих веток

### feature/add-tax-sources
- **Размер**: ~300 файлов
- **Тип**: Новый функционал
- **Приоритет**: Высокий
- **Зависимости**: Нет

### feature/dashboard-redesign  
- **Размер**: ~400 файлов
- **Тип**: UI/UX изменения
- **Приоритет**: Средний
- **Зависимости**: feature/add-tax-sources

### feature-export-excel
- **Размер**: ~200 файлов
- **Тип**: Новый функционал
- **Приоритет**: Средний
- **Зависимости**: Нет

### new_search
- **Размер**: ~100 файлов
- **Тип**: Улучшение поиска
- **Приоритет**: Низкий
- **Зависимости**: Нет

## 🔄 Порядок мержа

### 1. feature/add-tax-sources (первая)
- Создать ветку `feature/merge-tax-sources`
- Загрузить изменения
- Создать PR в develop
- Code review + мерж

### 2. feature-export-excel (вторая)
- Создать ветку `feature/merge-export-excel`
- Загрузить изменения
- Создать PR в develop
- Code review + мерж

### 3. new_search (третья)
- Создать ветку `feature/merge-new-search`
- Загрузить изменения
- Создать PR в develop
- Code review + мерж

### 4. feature/dashboard-redesign (последняя)
- Создать ветку `feature/merge-dashboard`
- Загрузить изменения
- Создать PR в develop
- Code review + мерж

## 🛠️ Технические детали

### Создание веток мержа
```bash
# Для каждой ветки
git checkout develop
git pull origin develop
git checkout -b feature/merge-[branch-name]
# Копируем файлы из локальной ветки разработчика
git add .
git commit -m "feat: merge [branch-name] from developer"
git push origin feature/merge-[branch-name]
```

### Разрешение конфликтов
- Используем `git merge-base` для анализа
- Создаем backup перед каждым мержем
- Тестируем после каждого мержа

### Валидация
- Запуск тестов после каждого мержа
- Проверка работоспособности приложения
- Code review минимум 2 разработчиками
