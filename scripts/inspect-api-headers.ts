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
    const res = await client.post('/bytedance/seedance-2.0/image-to-video', {});
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    console.log('Data:', res.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error headers:', err.response?.headers);
    console.log('Error data:', err.response?.data);
  }
}

main();
