import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Тестовые маршруты
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/api/sources', (req, res) => {
  res.json([
    { id: '1', name: 'ФНС', url: 'https://www.nalog.gov.ru', type: 'website', isEnabled: true },
    { id: '2', name: 'Минфин', url: 'https://minfin.gov.ru', type: 'website', isEnabled: true }
  ]);
});

app.get('/api/keywords', (req, res) => {
  res.json([
    { id: '1', text: 'налог' },
    { id: '2', text: 'НДС' },
    { id: '3', text: 'ФНС' }
  ]);
});

app.get('/api/email-settings', (req, res) => {
  res.json({
    email: 'test@example.com',
    isEnabled: true,
    summaryFrequency: 'DAILY'
  });
});

app.put('/api/email-settings', (req, res) => {
  res.json({
    message: 'Email settings updated successfully',
    settings: req.body
  });
});

app.post('/api/email-settings/test', (req, res) => {
  res.json({
    message: 'Test email sent successfully'
  });
});

// Auth маршруты
app.get('/api/auth/profile', (req, res) => {
  res.json({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Тест',
    lastName: 'Пользователь',
    region: 'Москва',
    isVerified: true
  });
});

app.put('/api/auth/profile', (req, res) => {
  res.json({
    message: 'Profile updated successfully',
    user: req.body
  });
});

app.put('/api/auth/change-password', (req, res) => {
  res.json({
    message: 'Password changed successfully'
  });
});

app.delete('/api/auth/account', (req, res) => {
  res.json({
    message: 'Account deleted successfully'
  });
});

// Reports маршруты
app.get('/api/reports', (req, res) => {
  res.json({
    reports: [
      { id: '1', name: 'Отчет за январь', fileUrl: '/reports/1.xlsx', dateFrom: '2025-01-01', dateTo: '2025-01-31', keywordsUsed: 'налог, НДС', itemCount: 150, createdAt: '2025-01-31T00:00:00Z' }
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Test server запущен на порту ${port}`);
  console.log(`📡 API доступен по адресу: http://localhost:${port}/api`);
});
