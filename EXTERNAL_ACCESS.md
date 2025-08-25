# Настройка внешнего доступа к TaxNewsRadar

## Обзор

Этот документ описывает, как настроить TaxNewsRadar для доступа из внешней сети, чтобы вы могли поделиться ссылкой с друзьями и коллегами.

## Требования

1. **Статический IP адрес** или **доменное имя**
2. **Настроенный файрвол** для портов 3001 (сервер) и 5173 (клиент)
3. **Переменные окружения** для внешнего URL

## Шаги настройки

### 1. Настройка переменных окружения

Создайте или обновите файл `.env` в корне проекта:

```bash
# Основные настройки
DATABASE_URL="mysql://user:password@localhost:3306/taxnewsradar"
NODE_ENV="production"

# Настройки внешнего доступа
FRONTEND_URL="http://your-domain.com:5173"  # или ваш IP адрес
ALLOWED_ORIGINS="http://your-domain.com:5173,http://your-domain.com:3001"

# Email настройки (если используете)
EMAIL_HOST="smtp.mail.ru"
EMAIL_PORT="465"
EMAIL_USER="your-email@mail.ru"
EMAIL_PASS="your-app-password"
```

### 2. Настройка файрвола

#### Windows (Windows Defender)
1. Откройте "Брандмауэр Защитника Windows"
2. Нажмите "Дополнительные параметры"
3. Выберите "Правила для входящих подключений" → "Создать правило"
4. Создайте правила для портов:
   - **3001** (сервер API)
   - **5173** (клиент)

#### Linux (ufw)
```bash
sudo ufw allow 3001
sudo ufw allow 5173
sudo ufw enable
```

#### macOS
1. Системные настройки → Безопасность и конфиденциальность → Брандмауэр
2. Нажмите "Параметры брандмауэра"
3. Добавьте правила для портов 3001 и 5173

### 3. Запуск приложения

#### Режим разработки (с внешним доступом)
```bash
# Терминал 1 - Сервер
npm run dev:server

# Терминал 2 - Клиент
npm run dev:client
```

#### Продакшн режим
```bash
# Сборка клиента
npm run build

# Запуск сервера
npm start
```

### 4. Проверка доступа

1. **Локально**: `http://localhost:5173`
2. **Внешне**: `http://your-ip:5173` или `http://your-domain:5173`

### 5. Настройка доменного имени (опционально)

Если у вас есть доменное имя:

1. **Настройте DNS записи**:
   ```
   A    your-domain.com    YOUR_IP_ADDRESS
   ```

2. **Обновите переменные окружения**:
   ```bash
   FRONTEND_URL="http://your-domain.com:5173"
   ALLOWED_ORIGINS="http://your-domain.com:5173,http://your-domain.com:3001"
   ```

## Безопасность

### Рекомендации

1. **Используйте HTTPS** в продакшене
2. **Ограничьте доступ** по IP адресам при необходимости
3. **Регулярно обновляйте** зависимости
4. **Мониторьте логи** на предмет подозрительной активности

### Настройка HTTPS (опционально)

Для настройки HTTPS используйте reverse proxy (nginx):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Устранение неполадок

### Проблема: Не могу подключиться извне

1. **Проверьте файрвол**:
   ```bash
   # Windows
   netsh advfirewall firewall show rule name=all | findstr "3001\|5173"
   
   # Linux
   sudo ufw status
   ```

2. **Проверьте порты**:
   ```bash
   # Windows
   netstat -an | findstr "3001\|5173"
   
   # Linux/macOS
   netstat -tulpn | grep -E "3001|5173"
   ```

3. **Проверьте CORS настройки**:
   - Убедитесь, что `ALLOWED_ORIGINS` содержит правильные домены
   - Проверьте консоль браузера на ошибки CORS

### Проблема: Email не отправляется

1. **Проверьте настройки SMTP** в `.env`
2. **Убедитесь, что FRONTEND_URL** настроен правильно
3. **Проверьте логи** сервера на ошибки

### Проблема: База данных недоступна

1. **Проверьте DATABASE_URL** в `.env`
2. **Убедитесь, что MySQL** запущен и доступен
3. **Проверьте права доступа** пользователя базы данных

## Примеры конфигурации

### Локальная сеть
```bash
FRONTEND_URL="http://192.168.1.100:5173"
ALLOWED_ORIGINS="http://192.168.1.100:5173,http://192.168.1.100:3001"
```

### Облачный сервер
```bash
FRONTEND_URL="http://your-server-ip:5173"
ALLOWED_ORIGINS="http://your-server-ip:5173,http://your-server-ip:3001"
```

### Доменное имя
```bash
FRONTEND_URL="https://your-domain.com"
ALLOWED_ORIGINS="https://your-domain.com"
```

## Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера и клиента
2. Убедитесь, что все порты открыты
3. Проверьте настройки CORS
4. Обратитесь к документации или создайте issue в репозитории
