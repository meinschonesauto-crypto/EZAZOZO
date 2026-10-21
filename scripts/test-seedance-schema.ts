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
  try {
    const res = await client.post('/bytedance/seedance-2.0/image-to-video', {
      image_url: 'invalid_url',
      prompt: 'test',
      duration: 5,
      resolution: '720p'
    });
    console.log('Result:', res.status, res.data);
  } catch (err: any) {
    console.log('Status:', err.response?.status);
    console.log('Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

main();
