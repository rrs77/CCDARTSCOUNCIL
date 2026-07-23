import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
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

const r = spawnSync(
  ffmpegPath,
  ['-y', '-i', input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
