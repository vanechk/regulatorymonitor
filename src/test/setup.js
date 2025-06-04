"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Создаем тестовую базу данных
const prisma = new client_1.PrismaClient();
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
