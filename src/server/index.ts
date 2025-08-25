import express from 'express';
import cors from 'cors';
import { apiRouter } from './api';
import { TelegramService } from './utils/telegram';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API маршруты
app.use('/api', apiRouter);

// Инициализация сервисов
async function initializeServices() {
  try {
    // Инициализируем Telegram сервис
    await TelegramService.initialize();
    console.log('✅ Telegram сервис инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации сервисов:', error);
  }
}

// Запускаем сервер
app.listen(port, async () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
  
  // Инициализируем сервисы после запуска сервера
  await initializeServices();
}); 