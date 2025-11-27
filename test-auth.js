const axios = require('axios');

const email = 'sanjarr_mm@mail.ru';
const password = 'SoaMTa';

const endpoints = [
  '/login',
  '/auth',
  '/authenticate',
  '/user/login',
  '/user/auth',
];

const testEndpoints = async () => {
  console.log('Testing Sipuni authentication endpoints...\n');

  for (const endpoint of endpoints) {
    const url = `https://apilk.sipuni.com/api/ver2${endpoint}`;
    console.log(`Testing: ${url}`);

    try {
      const response = await axios.post(url, { email, password }, {
        timeout: 5000,
        validateStatus: () => true,
      });

      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
      console.log('---\n');

      // If we got a token, log it
      if (response.data && (response.data.token || response.data.access_token)) {
        console.log(`✅ Token found at ${endpoint}:`);
        console.log(response.data.token || response.data.access_token);
        console.log('\n');
      }
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
  }
};

testEndpoints();
