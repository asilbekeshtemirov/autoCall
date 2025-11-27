/**
 * Sipuni API Direct Test
 *
 * Run: node test-sipuni.js
 */

const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYnhJZCI6MzA2MTYyLCJjdXN0SWQiOiIwNjQ2MjkiLCJjcm0iOlsiYW1vY3JtIiwiZmFhcyJdLCJleHAiOjE3NjQyMjU4MzIsIm1hbmFnZXIiOjAsImFnZW50IjowLCJkZWxlZ2F0ZSI6MCwic2NybSI6Imh0dHA6XC9cL3Njcm0uc2lwdW5pLmNvbVwvdjFcLyJ9.-3Qn_ND3wJD9W2Qunxd9_DWx3zoWtWYQl3IgYuBqj58';

async function testSipuniAPI() {
  console.log('🧪 Testing Sipuni API...\n');

  const url = 'https://apilk.sipuni.com/api/ver2/autocall/?max=50&pos=0';

  try {
    console.log('📡 Sending request to:', url);
    console.log('🔑 Using token:', TOKEN.substring(0, 30) + '...\n');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));

    // Check structure
    console.log('\n📋 Data Structure:');
    console.log('- Type:', typeof data);
    console.log('- Is Array:', Array.isArray(data));
    console.log('- Has "data" property:', !!data.data);
    console.log('- Has "items" property:', !!data.items);

    if (Array.isArray(data)) {
      console.log('- Array length:', data.length);
    } else if (data.data && Array.isArray(data.data)) {
      console.log('- data.data length:', data.data.length);
    } else if (data.items && Array.isArray(data.items)) {
      console.log('- data.items length:', data.items.length);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSipuniAPI();
