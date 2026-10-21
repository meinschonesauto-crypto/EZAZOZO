import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';

const creds = process.env.HF_CREDENTIALS || '';

const client = axios.create({
  baseURL: 'https://api.higgsfield.ai',
  headers: {
    'Authorization': `Key ${creds}`,
    'User-Agent': 'higgsfield-server-js/2.0',
    'Content-Type': 'application/json'
  }
});

async function main() {
  const tests = [
    { method: 'get', url: '/openapi.json' },
    { method: 'get', url: '/docs' },
    { method: 'get', url: '/bytedance/seedance-2.0/image-to-video' },
    { method: 'options', url: '/bytedance/seedance-2.0/image-to-video' },
    { method: 'get', url: '/bytedance/seedance-2.0/image-to-video/schema' },
    { method: 'get', url: '/schemas/bytedance/seedance-2.0/image-to-video' },
    { method: 'get', url: '/v1/pricing' },
    { method: 'get', url: '/pricing' },
    { method: 'post', url: '/pricing', data: { model: 'bytedance/seedance-2.0/image-to-video' } },
    { method: 'post', url: '/bytedance/seedance-2.0/image-to-video/price', data: { duration: 8, resolution: '720p' } },
    { method: 'post', url: '/bytedance/seedance-2.0/image-to-video/estimate', data: { duration: 8, resolution: '720p' } }
  ];

  for (const t of tests) {
    try {
      const res = await (client as any)[t.method](t.url, t.data);
      console.log(`[SUCCESS ${t.method.toUpperCase()} ${t.url}] status ${res.status}`);
      console.log(JSON.stringify(res.data).slice(0, 300));
    } catch (err: any) {
      console.log(`[FAIL ${t.method.toUpperCase()} ${t.url}] status ${err.response?.status}:`, JSON.stringify(err.response?.data || err.message));
    }
  }
}

main();
