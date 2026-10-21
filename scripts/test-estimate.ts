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

async function testEstimate(endpoint: string, payload: any) {
  try {
    const res = await client.post(`${endpoint}/estimate`, payload);
    console.log(`[ESTIMATE SUCCESS] ${endpoint}:`, res.status, res.data);
    return res.data;
  } catch (err: any) {
    console.log(`[ESTIMATE ERROR] ${endpoint}:`, err.response?.status, err.response?.data || err.message);
    return null;
  }
}

async function main() {
  const models = [
    'bytedance/seedance-2.0/image-to-video',
    'bytedance/seedance-2/image-to-video',
    'bytedance/seedance-2.5/image-to-video',
    'kling-ai/kling-v1.6/image-to-video',
    'kling-ai/kling-v1.5/image-to-video',
    'minimax/hailuo-01/image-to-video'
  ];

  for (const m of models) {
    await testEstimate(m, {
      image_url: 'https://d3u0tzju9qaucj.cloudfront.net/[REDACTED_ACCOUNT_ID]/05cde0e4-8c8d-4b65-b74c-4b1df2d8f1c4.png',
      prompt: 'one single continuous first-person camera move gliding forward',
      duration: 5,
      resolution: '720p',
      generate_audio: false
    });
  }
}

main();
