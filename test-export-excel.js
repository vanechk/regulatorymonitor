const { PrismaClient } = require('@prisma/client');

async function testExportExcel() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Testing Excel Export with Source Type Filtering ===');

    // Test 1: Export all news
    console.log('\n1. Testing export of all news...');
    const { exportToExcel } = await import('./api.js');
    
    try {
      const result1 = await exportToExcel({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sourceType: undefined // all sources
      });
      console.log('✅ All news export result:', result1);
    } catch (error) {
      console.log('❌ All news export error:', error.message);
    }

    // Test 2: Export only website sources
    console.log('\n2. Testing export of website sources only...');
    try {
      const result2 = await exportToExcel({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sourceType: 'website'
      });
      console.log('✅ Website sources export result:', result2);
    } catch (error) {
      console.log('❌ Website sources export error:', error.message);
    }

    // Test 3: Export only telegram sources
    console.log('\n3. Testing export of telegram sources only...');
    try {
      const result3 = await exportToExcel({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sourceType: 'telegram'
      });
      console.log('✅ Telegram sources export result:', result3);
    } catch (error) {
      console.log('❌ Telegram sources export error:', error.message);
    }

    // Test 4: Export with date range and source type
    console.log('\n4. Testing export with specific date range and source type...');
    try {
      const result4 = await exportToExcel({
        dateFrom: '2024-06-01',
        dateTo: '2024-06-30',
        sourceType: 'website',
        keywords: ['налог', 'НДС']
      });
      console.log('✅ Date range + source type + keywords export result:', result4);
    } catch (error) {
      console.log('❌ Date range + source type + keywords export error:', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExportExcel(); 