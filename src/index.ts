import { app } from './app';

const BASE_PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_ATTEMPTS = 5;

function startServer(port: number, attempt = 1) {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_ATTEMPTS) {
      console.warn(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1, attempt + 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

startServer(BASE_PORT); 