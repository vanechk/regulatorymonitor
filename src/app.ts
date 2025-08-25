const express = require('express');
const cors = require('cors');
const { router: apiRouter } = require('./server/simple-api');

const app = express();

// Настройка CORS для поддержки внешнего доступа
app.use(cors({
  origin: function (origin: string, callback: Function) {
    // Разрешаем все источники в режиме разработки
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // В продакшене можно ограничить конкретными доменами
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:5173', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Базовый маршрут для проверки работоспособности
app.get('/', (req: any, res: any) => {
  res.json({ 
    message: 'TaxNewsRadar API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API маршруты
app.use('/api', apiRouter);

module.exports = { app }; 