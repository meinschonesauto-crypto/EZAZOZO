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
  const reqIds = [
    'b990b2c4-1a52-4fae-8bbf-b023a7b8909b',
    '9979b065-451f-4d29-8030-4368072b132d',
    'fd1695f4-a9c1-4933-8dda-e80c185174c4',
    '0dbcb7f2-93c9-46f3-9e13-e2bdd3fc5468'
  ];

  for (const id of reqIds) {
    try {
      const res = await client.get(`/requests/${id}/status`);
      console.log(`=== Request ${id} ===`);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      console.log(`Request ${id} failed:`, err.response?.status, err.response?.data || err.message);
    }
  }
}

main();
