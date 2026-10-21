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
  const estimateEndpoints = [
    '/estimate',
    '/v1/estimate',
    '/v2/estimate',
    '/pricing/estimate'
  ];

  for (const ep of estimateEndpoints) {
    try {
      const res = await client.post(ep, {
        endpoint: 'bytedance/seedance-2.5/image-to-video',
        input: {
          image_url: 'https://d3u0tzju9qaucj.cloudfront.net/[REDACTED_ACCOUNT_ID]/05cde0e4-8c8d-4b65-b74c-4b1df2d8f1c4.png',
          duration: 5,
          resolution: '720p'
        }
      });
      console.log(`[FOUND ${ep}]`, res.status, res.data);
    } catch (err: any) {
      console.log(`[FAIL ${ep}]`, err.response?.status, err.response?.data || err.message);
    }
  }
}

main();
