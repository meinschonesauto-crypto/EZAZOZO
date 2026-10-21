import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const creds = process.env.HF_CREDENTIALS || '';

const client = axios.create({
  baseURL: 'https://api.higgsfield.ai',
  headers: {
    'Authorization': `Key ${creds}`,
    'User-Agent': 'higgsfield-server-js/2.0',
    'Content-Type': 'application/json'
  }
});

// Prompt strictly following all negative and positive directives:
// - Never the word "drone"
// - "one single continuous first-person camera move, no cuts; the camera itself is moving; nothing flying or hovering is ever visible in frame"
// - "every person, vehicle and object is stationary unless described; nothing appears, disappears or changes"
// - Timed manoeuvres for Scenes 01 and 02:
//   Approach in the street (Agoé Assiyéyé), bank past the mangrove-wood grill, enter the covered terrace, yaw to the grill master, S-curve between tables, line up on the lounge doorway
// - Black Togolese people only
// - Warm ember light against cool dusk blue
// - No text, no logos, no brand badges, no signage lettering
const CLIP_A_PROMPT = 
  "one single continuous first-person camera move, no cuts; the camera itself is moving; nothing flying or hovering is ever visible in frame. " +
  "every person, vehicle and object is stationary unless described; nothing appears, disappears or changes. " +
  "At dusk in Agoé Assiyéyé Lomé, cool dusk blue ambient sky with warm glowing ember light from the charcoal brazier. " +
  "0-2s: eye-level glide forward along the paved street toward the entrance, ember glow ahead. " +
  "2-4s: banks right past the smoking mangrove-wood grill and the Black Togolese grill master turning whole fish. " +
  "4-6s: passes through the wide open entrance of the covered paved terrace, yaws left toward the tables. " +
  "6-8s: S-curve between the seated Black Togolese diners and lines up centered on the open lounge doorway, ending on a clear, steady view of that doorway. " +
  "Black Togolese people only; Agoé Assiyéyé street setting; warm ember light against cool dusk blue; hyper-realistic architectural cinematography, 24fps natural camera motion blur, no text, no logos, no brand badges, no signage lettering.";

async function runClipA() {
  console.log('=== PREPARING CLIP A GENERATION ===');
  console.log('Model: bytedance/seedance-2.0/image-to-video');
  console.log('Duration: 8s | Resolution: 720p | Audio: false');

  // Start still URL from verified job 9979b065-451f-4d29-8030-4368072b132d
  const statusRes = await client.get('/requests/9979b065-451f-4d29-8030-4368072b132d/status');
  const imageUrl = statusRes.data.images[0].url;

  const payload = {
    image_url: imageUrl,
    prompt: CLIP_A_PROMPT,
    duration: 8,
    resolution: '720p',
    generate_audio: false
  };

  console.log('Submitting request to Higgsfield API...');
  const res = await client.post('/bytedance/seedance-2.0/image-to-video', payload);
  console.log('Job submitted successfully!');
  console.log('Request ID:', res.data.request_id);
  console.log('Status URL:', res.data.status_url);

  // Log to requests.log.jsonl
  const logEntry = {
    at: new Date().toISOString(),
    label: 'clip-a',
    endpoint: 'bytedance/seedance-2.0/image-to-video',
    request_id: res.data.request_id,
    status: 'queued'
  };
  fs.appendFileSync(path.resolve('generation/requests.log.jsonl'), JSON.stringify(logEntry) + '\n');

  console.log('Polling for completion (no retry on failure)...');
  const pollUrl = `/requests/${res.data.request_id}/status`;
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > 15 * 60 * 1000) {
      throw new Error('Polling timeout after 15 minutes');
    }
    await new Promise(r => setTimeout(r, 6000));
    const pollRes = await client.get(pollUrl);
    const data = pollRes.data;
    console.log(`[${Math.round((Date.now() - startTime) / 1000)}s] Status: ${data.status}`);

    if (data.status === 'completed') {
      console.log('Generation completed!');
      console.log('Video URL:', data.video?.url);

      // Download video
      const videoRes = await axios.get(data.video.url, { responseType: 'arraybuffer' });
      const outPath = path.resolve('generation/clips/clip-a.mp4');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, Buffer.from(videoRes.data));
      console.log(`Saved video to ${outPath}`);

      fs.appendFileSync(path.resolve('generation/requests.log.jsonl'), JSON.stringify({
        at: new Date().toISOString(),
        label: 'clip-a',
        request_id: res.data.request_id,
        status: 'completed',
        file: outPath
      }) + '\n');
      break;
    } else if (data.status === 'failed') {
      console.error('Generation failed:', data.error);
      fs.appendFileSync(path.resolve('generation/requests.log.jsonl'), JSON.stringify({
        at: new Date().toISOString(),
        label: 'clip-a',
        request_id: res.data.request_id,
        status: 'failed',
        error: data.error
      }) + '\n');
      break;
    }
  }
}

if (process.argv.includes('--execute')) {
  runClipA().catch(err => {
    console.error('Execution error:', err.response?.data || err.message);
  });
} else {
  console.log('Script dry-run loaded. Pass --execute to run.');
}
