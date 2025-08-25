import { PrismaClient } from '@prisma/client';

// Создаем тестовую базу данных
const prisma = new PrismaClient();

beforeAll(async () => {
  // Очищаем базу данных перед тестами
  await prisma.newsItem.deleteMany();
  await prisma.source.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.report.deleteMany();
  await prisma.emailSettings.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
}); 