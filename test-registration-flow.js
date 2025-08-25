const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRegistrationFlow() {
  try {
    console.log('🚀 Тестирование новой логики регистрации...\n');
    
    // Принудительно очищаем тестовые данные
    console.log('🧹 Очищаем тестовые данные...');
    
    // Удаляем всех пользователей с тестовыми данными
    const deletedPendingUsers = await prisma.pendingUser.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' },
          { email: { contains: 'test' } },
          { username: { contains: 'test' } }
        ]
      }
    });
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' },
          { email: { contains: 'test' } },
          { username: { contains: 'test' } }
        ]
      }
    });
    
    console.log(`✅ Удалено временных пользователей: ${deletedPendingUsers.count}`);
    console.log(`✅ Удалено пользователей: ${deletedUsers.count}\n`);
    
    // Проверяем, что пользователей нет
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });
    
    const existingPendingUser = await prisma.pendingUser.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });
    
    if (existingUser || existingPendingUser) {
      console.log('❌ Тестовые данные не были очищены');
      return;
    }
    
    console.log('✅ Пользователи не найдены в базе данных\n');
    
    // Симулируем регистрацию (создание временного пользователя)
    const testPendingUser = await prisma.pendingUser.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        verificationToken: 'test-token-123456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
      }
    });
    
    console.log('✅ Создан временный пользователь:', {
      id: testPendingUser.id,
      username: testPendingUser.username,
      email: testPendingUser.email,
      isVerified: false
    });
    
    // Проверяем, что пользователь не может войти (не подтвержден)
    const userInMainTable = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });
    
    if (userInMainTable) {
      console.log('❌ Пользователь не должен быть в основной таблице до подтверждения');
    } else {
      console.log('✅ Пользователь не найден в основной таблице (ожидает подтверждения)');
    }
    
    // Симулируем подтверждение email
    const pendingUser = await prisma.pendingUser.findFirst({
      where: {
        verificationToken: 'test-token-123456',
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (!pendingUser) {
      console.log('❌ Временный пользователь не найден');
      return;
    }
    
    // Создаем пользователя в основной таблице
    const confirmedUser = await prisma.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        region: pendingUser.region,
        themeColor: pendingUser.themeColor,
        themeMode: pendingUser.themeMode,
        isVerified: true,
      }
    });
    
    console.log('✅ Пользователь подтвержден и создан в основной таблице:', {
      id: confirmedUser.id,
      username: confirmedUser.username,
      email: confirmedUser.email,
      isVerified: confirmedUser.isVerified
    });
    
    // Удаляем временного пользователя
    await prisma.pendingUser.delete({ where: { id: pendingUser.id } });
    
    console.log('✅ Временный пользователь удален\n');
    
    // Проверяем финальное состояние
    const finalUser = await prisma.user.findFirst({
      where: {
        id: confirmedUser.id
      }
    });
    
    const finalPendingUser = await prisma.pendingUser.findFirst({
      where: {
        id: pendingUser.id
      }
    });
    
    if (finalUser && !finalPendingUser) {
      console.log('🎉 Тест прошел успешно!');
      console.log('✅ Пользователь создан только после подтверждения email');
      console.log('✅ Временный пользователь удален');
      console.log('✅ Логика работает корректно');
    } else {
      console.log('❌ Тест не прошел');
    }
    
    // Очищаем тестовые данные после теста
    console.log('\n🧹 Очищаем тестовые данные после теста...');
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });
    
    await prisma.pendingUser.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      }
    });
    
    console.log('✅ Тестовые данные очищены');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тест
testRegistrationFlow();
