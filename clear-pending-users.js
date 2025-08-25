// Скрипт для очистки всех аккаунтов, ожидающих подтверждения
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPendingUsers() {
  try {
    console.log('🧹 Начинаем очистку аккаунтов, ожидающих подтверждения...');
    
    // Получаем количество записей перед удалением
    const countBefore = await prisma.pendingUser.count();
    console.log(`📊 Найдено ${countBefore} аккаунтов, ожидающих подтверждения`);
    
    if (countBefore === 0) {
      console.log('✅ Нет аккаунтов для очистки');
      return;
    }
    
    // Удаляем все записи
    const result = await prisma.pendingUser.deleteMany({});
    
    console.log(`🗑️ Удалено ${result.count} аккаунтов`);
    console.log('✅ Очистка завершена успешно!');
    
  } catch (error) {
    console.error('💥 Ошибка при очистке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем очистку
clearPendingUsers();
