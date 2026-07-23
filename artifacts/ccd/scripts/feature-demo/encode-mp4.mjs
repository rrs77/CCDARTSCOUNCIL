import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../public/feature-demo');
const input = path.join(outDir, 'ccdesigner-feature-demo.webm');
const output = path.join(outDir, 'ccdesigner-feature-demo.mp4');

if (!ffmpegPath) {
  console.error('ffmpeg-static binary not found');
  process.exit(1);
}

function probeDurationSeconds(mediaPath) {
  const r = spawnSync(ffmpegPath, ['-i', mediaPath], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(r.stderr || '');
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
}

function resolveDemoMusicPath() {
  const candidates = [
    process.env.CCD_DEMO_MUSIC,
    path.join(outDir, 'audio/autumn-leaves-piano-improv.mp3'),
    '/Users/rfreich-storer/Music/4K YouTube to MP3/Autumn Leaves Piano Improv.mp3',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

if (!fs.existsSync(input)) {
  console.error('Missing input webm:', input);
  process.exit(1);
}

const audioPath = resolveDemoMusicPath();
const videoArgs = [
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '22',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
];

let args;
if (!audioPath) {
  console.warn('No demo music found — encoding silent MP4');
  args = ['-y', '-i', input, ...videoArgs, '-an', output];
} else {
  const dur = probeDurationSeconds(input) || 0;
  const fadeIn = Math.min(2.5, Math.max(0.5, dur * 0.04));
  const fadeOut = Math.min(3.5, Math.max(1, dur * 0.05));
  const fadeOutStart = Math.max(0, dur - fadeOut);
  const filter = `[1:a]volume=0.20,afade=t=in:st=0:d=${fadeIn.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOut.toFixed(2)}[aout]`;
  console.log(`Muxing background music: ${audioPath} (loop to ${dur.toFixed(1)}s, vol=0.20)`);
  args = [
    '-y',
    '-i',
    input,
    '-stream_loop',
    '-1',
    '-i',
    audioPath,
    '-filter_complex',
    filter,
    '-map',
    '0:v:0',
    '-map',
    '[aout]',
    ...videoArgs,
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-shortest',
    output,
  ];
}

const r = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
