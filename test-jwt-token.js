const axios = require('axios');

const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYnhJZCI6MzA2MTYyLCJjdXN0SWQiOiIwNjQ2MjkiLCJjcm0iOlsiYW1vY3JtIiwiZmFhcyJdLCJleHAiOjE3NjQyMjU4MzIsIm1hbmFnZXIiOjAsImFnZW50IjowLCJkZWxlZ2F0ZSI6MCwic2NybSI6Imh0dHA6XC9cL3Njcm0uc2lwdW5pLmNvbVwvdjFcLyJ9.-3Qn_ND3wJD9W2Qunxd9_DWx3zoWtWYQl3IgYuBqj58';

const testJWTToken = async () => {
  console.log('🔐 Testing JWT Bearer Token with Sipuni API\n');
  console.log('Token:', token.substring(0, 50) + '...\n');

  try {
    const response = await axios.get('https://apilk.sipuni.com/api/ver2/autocall/?max=1&pos=0', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
      validateStatus: () => true,
    });

    console.log('✅ Status:', response.status, response.statusText);
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500));

    if (response.status === 200) {
      console.log('\n🎉 JWT Token WORKS! ✅');
      console.log('\nToken Payload (decoded):');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log(JSON.stringify(payload, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testJWTToken();
