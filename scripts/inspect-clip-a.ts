import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const FFMPEG = path.resolve('node_modules/ffmpeg-static/ffmpeg.exe');

export function inspectClip(videoPath: string, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('=== FFMPEG INSPECTION ===');
  console.log('Video:', videoPath);

  // 1. Scene cut detection (gt(scene,0.3))
  console.log('\n--- 1. Running Scene-Cut Detection (gt(scene, 0.3)) ---');
  try {
    const cutOutput = execSync(
      `"${FFMPEG}" -i "${videoPath}" -filter_complex "select='gt(scene,0.3)',metadata=print:file=-" -f null -`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    console.log('Scene cut output:', cutOutput || 'No abrupt cuts detected (score <= 0.3)');
  } catch (err: any) {
    console.log('Scene cuts analysis stderr:', err.stderr ? err.stderr.slice(0, 500) : err.message);
  }

  // 2. Generate contact sheet at 2 frames per second
  console.log('\n--- 2. Generating Contact Sheet (2 frames per second) ---');
  const contactSheet = path.join(outputDir, 'contact-sheet-2fps.png');
  execSync(
    `"${FFMPEG}" -y -i "${videoPath}" -vf "fps=2,scale=320:180,tile=4x4" -frames:v 1 "${contactSheet}"`,
    { stdio: 'inherit' }
  );
  console.log('Contact sheet (2 fps) saved to:', contactSheet);

  // 3. Extract last frame
  console.log('\n--- 3. Extracting Last Frame ---');
  const lastFrame = path.join(outputDir, 'last-frame.png');
  execSync(
    `"${FFMPEG}" -y -sseof -0.1 -i "${videoPath}" -frames:v 1 "${lastFrame}"`,
    { stdio: 'inherit' }
  );
  console.log('Last frame saved to:', lastFrame);

  // 4. Zoom on the last 2 seconds (6s - 8s) and on the doorway
  console.log('\n--- 4. Zooming on Last 2 Seconds and Doorway ---');
  const doorwayZoom = path.join(outputDir, 'doorway-zoom-last2s.png');
  execSync(
    `"${FFMPEG}" -y -ss 6.0 -i "${videoPath}" -vf "crop=iw/1.8:ih/1.8:iw/4.5:ih/4.5,scale=640:360,fps=2,tile=2x2" -frames:v 1 "${doorwayZoom}"`,
    { stdio: 'inherit' }
  );
  console.log('Doorway zoom on last 2s saved to:', doorwayZoom);
}

if (process.argv.includes('--run')) {
  inspectClip(
    path.resolve('generation/clips/clip-a.mp4'),
    path.resolve('generation/inspection/clip-a')
  );
}
