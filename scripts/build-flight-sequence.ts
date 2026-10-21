import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FFMPEG = path.resolve('node_modules/ffmpeg-static/ffmpeg.exe');
const OUT_DIR = path.resolve('public');
const FRAMES_DESKTOP = path.resolve('public/frames/desktop');
const FRAMES_MOBILE = path.resolve('public/frames/mobile');

fs.mkdirSync(FRAMES_DESKTOP, { recursive: true });
fs.mkdirSync(FRAMES_MOBILE, { recursive: true });

async function main() {
  console.log('--- Building EZAZOZO Master FPV Flight Sequence ---');

  const startStill = path.resolve('public/images/start-still.png');
  const terrasse = path.resolve('public/images/terrasse.png');
  const braise = path.resolve('public/images/braise.png');
  const interieur = path.resolve('public/images/interieur.png');
  const terrasseNuit = path.resolve('public/images/terrasse-nuit.png');
  const revealStill = path.resolve('public/images/reveal-still.png');

  // We generate 5 smooth movement segments (1280x720, 20fps)
  const tempDir = path.resolve('generation/temp_segments');
  fs.mkdirSync(tempDir, { recursive: true });

  const seg1 = path.join(tempDir, 'seg1.mp4'); // Scene 01: Arrivée (gliding forward into terrace)
  const seg2 = path.join(tempDir, 'seg2.mp4'); // Scene 02: Braise & Grill (sizzling whole fish over coals)
  const seg3 = path.join(tempDir, 'seg3.mp4'); // Scene 03: Salon & Cave (geometric textile art & VIP lounge)
  const seg4 = path.join(tempDir, 'seg4.mp4'); // Transition: Terrace night exit
  const seg5 = path.join(tempDir, 'seg5.mp4'); // Scene 04: Reverse climb into night sky

  console.log('Rendering Segment 1 (Arrivée)...');
  execSync(`"${FFMPEG}" -y -loop 1 -i "${startStill}" -t 3.5 -vf "scale=1920:1080,zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+15':d=70:s=1280x720:fps=20" -c:v libx264 -pix_fmt yuv420p "${seg1}"`, { stdio: 'inherit' });

  console.log('Rendering Segment 2 (Braise & Grill)...');
  execSync(`"${FFMPEG}" -y -loop 1 -i "${braise}" -t 3.5 -vf "scale=1920:1080,zoompan=z='min(zoom+0.0018,1.28)':x='iw/2-(iw/zoom/2)-20':y='ih/2-(ih/zoom/2)':d=70:s=1280x720:fps=20" -c:v libx264 -pix_fmt yuv420p "${seg2}"`, { stdio: 'inherit' });

  console.log('Rendering Segment 3 (Salon & Cave)...');
  execSync(`"${FFMPEG}" -y -loop 1 -i "${interieur}" -t 3.5 -vf "scale=1920:1080,zoompan=z='min(zoom+0.0015,1.22)':x='iw/2-(iw/zoom/2)+25':y='ih/2-(ih/zoom/2)':d=70:s=1280x720:fps=20" -c:v libx264 -pix_fmt yuv420p "${seg3}"`, { stdio: 'inherit' });

  console.log('Rendering Segment 4 (Sortie Terrasse Nuit)...');
  execSync(`"${FFMPEG}" -y -loop 1 -i "${terrasseNuit}" -t 2.5 -vf "scale=1920:1080,zoompan=z='min(zoom+0.002,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=50:s=1280x720:fps=20" -c:v libx264 -pix_fmt yuv420p "${seg4}"`, { stdio: 'inherit' });

  console.log('Rendering Segment 5 (Révélation Ciel & Route)...');
  // Reverse climb: zoom out from 1.35 down to 1.0, climbing upward
  execSync(`"${FFMPEG}" -y -loop 1 -i "${revealStill}" -t 4.5 -vf "scale=1920:1080,zoompan=z='if(lte(zoom,1.0),1.0,max(1.0,1.32-on*0.0035))':x='iw/2-(iw/zoom/2)':y='if(lte(zoom,1.0),ih/2-(ih/zoom/2),max(0,ih/2-(ih/zoom/2)-on*0.8))':d=90:s=1280x720:fps=20" -c:v libx264 -pix_fmt yuv420p "${seg5}"`, { stdio: 'inherit' });

  console.log('Combining with cinematic crossfades into master video...');
  const masterMp4 = path.resolve('public/flythrough-master.mp4');
  
  // Concat with xfade
  const filterComplex = 
    `[0:v][1:v]xfade=transition=fadeblack:duration=0.5:offset=3.0[v01];` +
    `[v01][2:v]xfade=transition=fadeblack:duration=0.5:offset=6.0[v02];` +
    `[v02][3:v]xfade=transition=fadeblack:duration=0.5:offset=9.0[v03];` +
    `[v03][4:v]xfade=transition=fadeblack:duration=0.6:offset=11.0[vmaster]`;

  execSync(`"${FFMPEG}" -y -i "${seg1}" -i "${seg2}" -i "${seg3}" -i "${seg4}" -i "${seg5}" -filter_complex "${filterComplex}" -map "[vmaster]" -c:v libx264 -pix_fmt yuv420p "${masterMp4}"`, { stdio: 'inherit' });

  console.log('Master video assembled at:', masterMp4);

  // Extract Desktop WebP (1280px wide, quality 75, 18-20fps)
  console.log('Extracting Desktop WebP frames...');
  execSync(`"${FFMPEG}" -y -i "${masterMp4}" -vf "fps=18,scale=1280:-1" -c:v libwebp -quality 75 "${FRAMES_DESKTOP}/frame-%04d.webp"`, { stdio: 'inherit' });

  // Extract Mobile WebP (800px wide, quality 70, 18fps)
  console.log('Extracting Mobile WebP frames...');
  execSync(`"${FFMPEG}" -y -i "${masterMp4}" -vf "fps=18,scale=800:-1" -c:v libwebp -quality 70 "${FRAMES_MOBILE}/frame-%04d.webp"`, { stdio: 'inherit' });

  const desktopFrames = fs.readdirSync(FRAMES_DESKTOP).filter(f => f.endsWith('.webp'));
  const mobileFrames = fs.readdirSync(FRAMES_MOBILE).filter(f => f.endsWith('.webp'));

  console.log(`Extracted: ${desktopFrames.length} desktop frames, ${mobileFrames.length} mobile frames.`);

  // Write manifest.json
  const manifest = {
    frameCount: desktopFrames.length,
    fps: 18,
    desktop: {
      width: 1280,
      pathPrefix: '/frames/desktop/frame-',
      format: 'webp',
      padding: 4
    },
    mobile: {
      width: 800,
      pathPrefix: '/frames/mobile/frame-',
      format: 'webp',
      padding: 4
    },
    poster: '/images/start-still.png',
    revealPoster: '/images/reveal-still.png',
    version: '1.0.0',
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.resolve('public/frames/manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Manifest written to public/frames/manifest.json');
}

main().catch(err => {
  console.error('Error generating sequence:', err);
  process.exit(1);
});
