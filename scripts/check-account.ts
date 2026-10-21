import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';

const creds = process.env.HF_CREDENTIALS || '';
console.log('Creds format check:', creds ? 'Present (length ' + creds.length + ')' : 'Missing');

const client = axios.create({
  baseURL: 'https://api.higgsfield.ai',
  headers: {
    'Authorization': `Key ${creds}`,
    'User-Agent': 'higgsfield-server-js/2.0',
    'Content-Type': 'application/json'
  }
});

async function main() {
  const testEndpoints = [
    '/v1/user',
    '/v1/users/me',
    '/v1/me',
    '/v1/account',
    '/v1/billing',
    '/v1/balance',
    '/v1/credits',
    '/v1/models',
    '/requests',
    '/v2/models',
    '/v1/pricing'
  ];

  for (const ep of testEndpoints) {
    try {
      const res = await client.get(ep);
      console.log(`[SUCCESS] ${ep}: status ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    } catch (err: any) {
      console.log(`[FAIL] ${ep}: ${err.response?.status || err.message}`);
    }
  }
}

main();
