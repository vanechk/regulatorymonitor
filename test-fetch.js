async function testFetch() {
  try {
    console.log('Testing news fetch...');
    
    const response = await fetch('http://localhost:3000/api/news/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceType: 'telegram',
        keywords: ['налог']
      }),
    });
    
    const result = await response.json();
    console.log('Fetch result:', result);
    
    // Подождем и проверим новости
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const newsResponse = await fetch('http://localhost:3000/api/news');
    const news = await newsResponse.json();
    console.log('News count:', news.length);
    console.log('News:', news);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFetch(); 