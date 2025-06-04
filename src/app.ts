import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { apiRouter } from './routes/api';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Базовый маршрут для проверки работоспособности
app.get('/', (req, res) => {
  res.json({ message: 'TaxNewsRadar API is running' });
});

// API маршруты
app.use('/api', apiRouter);

export { app }; 