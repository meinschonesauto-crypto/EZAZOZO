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
  const models = [
    'bytedance/seedance-2.5/image-to-video',
    'bytedance/seedance-2.0/image-to-video',
    'bytedance/seedance-2/image-to-video',
    'bytedance/seedance-1.0/image-to-video',
    'seedance/image-to-video'
  ];

  for (const m of models) {
    try {
      const res = await client.post(`/${m}`, {});
      console.log(`[POST ${m}]`, res.status, res.data);
    } catch (err: any) {
      console.log(`[POST ${m}]`, err.response?.status, JSON.stringify(err.response?.data));
    }
  }
}

main();
