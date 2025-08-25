import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
// Будем динамически загружать API роутер, чтобы гарантированно использовать TypeScript-версию

console.log('🚀 Server: Начинаю запуск сервера...');
console.log('🔍 Server: Текущая директория:', process.cwd());
console.log('🔍 Server: Переменные окружения загружаются...');

// Загружаем переменные окружения
config();
console.log('✅ Server: Переменные окружения загружены');

// Проверяем критические переменные
console.log('🔍 Server: Проверяю критические переменные окружения:');
console.log('🔍 Server: NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Server: PORT:', process.env.PORT);
console.log('🔍 Server: JWT_SECRET:', process.env.JWT_SECRET ? 'установлен' : 'отсутствует');
console.log('🔍 Server: DATABASE_URL:', process.env.DATABASE_URL ? 'установлен' : 'отсутствует');
console.log('🔍 Server: EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('🔍 Server: EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 Server: EMAIL_PASS:', process.env.EMAIL_PASS ? 'установлен' : 'отсутствует');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔍 Server: Express приложение создано');
console.log('🔍 Server: Порт для запуска:', PORT);

// Middleware
console.log('🔍 Server: Настраиваю middleware...');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
console.log('✅ Server: CORS настроен для:', process.env.FRONTEND_URL || 'http://localhost:5173');

app.use(express.json());
console.log('✅ Server: JSON middleware настроен');

app.use(express.urlencoded({ extended: true }));
console.log('✅ Server: URL encoded middleware настроен');

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`🔍 Server: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('🔍 Server: Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('🔍 Server: Body:', req.body);
  }
  next();
});

console.log('✅ Server: Логирование запросов настроено');

// Функция для загрузки API роутера с приоритетом .ts
const loadApiRouter = (): any => {
  try {
    // Пробуем TypeScript файл напрямую
    const mod = require('./server/api.ts');
    return mod.apiRouter || mod.router || mod.default || mod;
  } catch (eTs) {
    try {
      // Пробуем импорт без расширения (в ts-node должен подтянуть .ts)
      const modAny = require('./server/api');
      return modAny.apiRouter || modAny.router || modAny.default || modAny;
    } catch (eNoExt) {
      // Фолбэк на .js (устаревшая версия)
      const modJs = require('./server/api.js');
      return modJs.apiRouter || modJs.router || modJs.default || modJs;
    }
  }
};

// Запускаем сервер
const startServer = async () => {
  try {
    // Загружаем и монтируем API роутер
    console.log('🔍 Server: Монтирую API роутер на /api...');
    const apiRouterLoaded = loadApiRouter();
    app.use('/api', apiRouterLoaded);
    console.log('✅ Server: API роутер смонтирован на /api');
    
    // Тестовый endpoint
    app.get('/api/test', (req, res) => {
      console.log('🔍 Server: /api/test endpoint вызван');
      res.json({ 
        message: 'Сервер работает!', 
        timestamp: new Date().toISOString(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          FRONTEND_URL: process.env.FRONTEND_URL,
          DATABASE: process.env.DATABASE_URL ? 'MySQL с Prisma' : 'Не настроена'
        }
      });
    });

    // Обработка ошибок
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ Server: Необработанная ошибка:', err);
      console.error('❌ Server: Детали ошибки:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      
      res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        message: err.message 
      });
    });

    // Проверяем, что порт свободен
    const checkPort = () => {
      return new Promise((resolve, reject) => {
        const server = require('net').createServer();
        
        server.listen(PORT, () => {
          console.log(`✅ Server: Порт ${PORT} свободен`);
          server.close();
          resolve(true);
        });
        
        server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`❌ Server: Порт ${PORT} уже занят!`);
            console.log(`   Пожалуйста, остановите другие сервисы, использующие порт ${PORT}`);
            console.log(`   Или убейте процесс: netstat -ano | findstr :${PORT}`);
            reject(err);
          } else {
            reject(err);
          }
        });
      });
    };

    console.log('🔍 Server: Проверяю доступность порта...');
    await checkPort();
    
    console.log('🔍 Server: Запускаю сервер...');
    app.listen(PORT, () => {
      console.log(`🚀 Server: Сервер запущен на порту ${PORT}`);
      console.log(`🔍 Server: API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🔍 Server: Тестовый endpoint: http://localhost:${PORT}/api/test`);
      console.log(`🔍 Server: Время запуска: ${new Date().toISOString()}`);
      console.log(`🔍 Server: База данных: ${process.env.DATABASE_URL ? 'MySQL с Prisma' : 'Не настроена'}`);
    });
    
  } catch (error) {
    console.error('❌ Server: Не удалось запустить сервер:', error);
    process.exit(1);
  }
};

console.log('🚀 Server: Начинаю запуск...');
startServer(); 