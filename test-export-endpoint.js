const http = require('http');

async function testExportEndpoint() {
  try {
    console.log('Testing /api/reports/export endpoint...');
    
    // Test with minimal parameters
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/export?sourceType=website',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Response data:', data);
        } else {
          console.log('Error response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
    });
    
    req.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExportEndpoint(); 