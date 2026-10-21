import axios from 'axios';

async function testNetwork() {
  console.log('=== NETWORK AUDIT OF LOCALHOST:5173 ===\n');
  const baseURL = 'http://localhost:5173';

  // 1. Fetch index.html
  try {
    const res = await axios.get(baseURL);
    console.log(`[PASS] GET / -> ${res.status} (${res.data.length} bytes)`);
  } catch (err: any) {
    console.error(`[FAIL] GET / ->`, err.message);
  }

  // 2. Fetch manifest.json
  let manifest: any = null;
  try {
    const res = await axios.get(`${baseURL}/frames/manifest.json`);
    manifest = res.data;
    console.log(`[PASS] GET /frames/manifest.json -> ${res.status}`, manifest);
  } catch (err: any) {
    console.error(`[FAIL] GET /frames/manifest.json ->`, err.message);
  }

  // 3. Test frame requests from manifest
  if (manifest) {
    const testIndices = [1, 2, 5, 10, 50, 110, 111, 200, 279];
    console.log('\n--- Testing Mobile Frame URLs ---');
    for (const idx of testIndices) {
      const pad = String(idx).padStart(manifest.mobile.padding, '0');
      const url = `${baseURL}${manifest.mobile.pathPrefix}${pad}.${manifest.mobile.format}?v=${manifest.version}`;
      try {
        const res = await axios.head(url);
        console.log(`[PASS] Mobile frame ${idx}: ${res.status} ${res.headers['content-type']} (${res.headers['content-length']} bytes)`);
      } catch (err: any) {
        console.error(`[FAIL] Mobile frame ${idx}: ${url} -> ${err.response?.status || err.message}`);
      }
    }

    console.log('\n--- Testing Desktop Frame URLs ---');
    for (const idx of testIndices) {
      const pad = String(idx).padStart(manifest.desktop.padding, '0');
      const url = `${baseURL}${manifest.desktop.pathPrefix}${pad}.${manifest.desktop.format}?v=${manifest.version}`;
      try {
        const res = await axios.head(url);
        console.log(`[PASS] Desktop frame ${idx}: ${res.status} ${res.headers['content-type']} (${res.headers['content-length']} bytes)`);
      } catch (err: any) {
        console.error(`[FAIL] Desktop frame ${idx}: ${url} -> ${err.response?.status || err.message}`);
      }
    }
  }

  // 4. Test all static images
  const staticImages = [
    '/images/braise.png',
    '/images/plat.png',
    '/images/interieur.png',
    '/images/terrasse-nuit.png',
    '/images/terrasse.png',
    '/images/start-still.png',
    '/images/reveal-still.png',
    '/favicon.svg',
    '/icons.svg'
  ];

  console.log('\n--- Testing Static Images ---');
  for (const img of staticImages) {
    try {
      const res = await axios.head(`${baseURL}${img}`);
      console.log(`[PASS] ${img} -> ${res.status} (${res.headers['content-length']} bytes, ${res.headers['content-type']})`);
    } catch (err: any) {
      console.error(`[FAIL] ${img} -> ${err.response?.status || err.message}`);
    }
  }
}

testNetwork();
