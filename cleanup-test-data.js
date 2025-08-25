const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function cleanupTestData() {
  console.log('🧹 Очищаем тестовые данные...\n');

  try {
    // 1. Получаем список временных пользователей
    console.log('1️⃣ Получаем список временных пользователей...');
    const pendingUsersResponse = await fetch(`${API_BASE}/auth/pending-users`);
    const pendingUsersData = await pendingUsersResponse.json();
    
    if (pendingUsersData.pendingUsers && pendingUsersData.pendingUsers.length > 0) {
      console.log(`📋 Найдено ${pendingUsersData.pendingUsers.length} временных пользователей`);
      
      // Удаляем временных пользователей с тестовыми email
      for (const user of pendingUsersData.pendingUsers) {
        if (user.email.includes('test_') || user.email.includes('@example.com')) {
          console.log(`🗑️ Удаляем временного пользователя: ${user.email}`);
          // Здесь можно добавить API endpoint для удаления, если нужно
        }
      }
    } else {
      console.log('📋 Временных пользователей не найдено');
    }

    // 2. Получаем список основных пользователей
    console.log('\n2️⃣ Получаем список основных пользователей...');
    const usersResponse = await fetch(`${API_BASE}/auth/users`);
    const usersData = await usersResponse.json();
    
    if (usersData.users && usersData.users.length > 0) {
      console.log(`📋 Найдено ${usersData.users.length} основных пользователей`);
      
      // Показываем пользователей с тестовыми email
      const testUsers = usersData.users.filter(user => 
        user.email.includes('test_') || user.email.includes('@example.com')
      );
      
      if (testUsers.length > 0) {
        console.log(`📋 Найдено ${testUsers.length} тестовых пользователей:`);
        testUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.username}) - ${user.isVerified ? 'подтвержден' : 'не подтвержден'}`);
        });
      } else {
        console.log('📋 Тестовых пользователей не найдено');
      }
    } else {
      console.log('📋 Основных пользователей не найдено');
    }

    console.log('\n✅ Очистка завершена!');
    console.log('💡 Для полной очистки тестовых данных используйте Prisma Studio или SQL команды');

  } catch (error) {
    console.error('❌ Ошибка при очистке:', error.message);
  }
}

// Запускаем очистку
cleanupTestData();
