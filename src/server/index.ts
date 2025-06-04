import express from 'express';
import cors from 'cors';
import apiRouter from './api';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API маршруты
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
}); 