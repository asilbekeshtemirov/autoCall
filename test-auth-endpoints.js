const axios = require('axios');

const email = 'sanjarr_mm@mail.ru';
const password = 'SoaMTa';

const endpoints = [
  // Different base URLs
  { url: 'https://lk.sipuni.com/api/user/auth', desc: 'lk.sipuni.com - /api/user/auth' },
  { url: 'https://lk.sipuni.com/user/auth', desc: 'lk.sipuni.com - /user/auth' },
  { url: 'https://lk.sipuni.com/login', desc: 'lk.sipuni.com - /login' },
  { url: 'https://apilk.sipuni.com/user/auth', desc: 'apilk.sipuni.com - /user/auth (no /api/ver2)' },
  { url: 'https://apilk.sipuni.com/api/user/auth', desc: 'apilk.sipuni.com - /api/user/auth' },
  { url: 'https://apilk.sipuni.com/api/v1/user/auth', desc: 'apilk.sipuni.com - /api/v1/user/auth' },
  { url: 'https://api.sipuni.com/api/ver2/user/auth', desc: 'api.sipuni.com - /api/ver2/user/auth' },
  { url: 'https://api.sipuni.com/user/auth', desc: 'api.sipuni.com - /user/auth' },
  { url: 'https://sipuni.com/api/user/auth', desc: 'sipuni.com - /api/user/auth' },
];

const testEndpoints = async () => {
  console.log('🔍 Testing Sipuni authentication endpoints...\n');

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.desc}`);
    console.log(`URL: ${endpoint.url}`);

    try {
      const response = await axios.post(endpoint.url, { email, password }, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.status === 200 || response.status === 201) {
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        if (response.data && (response.data.token || response.data.access_token)) {
          console.log('\n🎉 TOKEN FOUND:');
          console.log(response.data.token || response.data.access_token);
        }
      } else if (response.status < 500) {
        console.log('Response (first 200 chars):', JSON.stringify(response.data).substring(0, 200));
      } else {
        console.log('Server error');
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    console.log('---\n');
  }
};

testEndpoints();
