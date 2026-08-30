import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
    path.join(outDir, 'audio/head-of-the-class.mp3'),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * Decode MP3 → PCM WAV (audio-only). Looping MP3 with -stream_loop desyncs after
 * the first pass (encoder delay / padding); PCM loops cleanly.
 */
function decodeMusicToWav(audioPath, wavPath) {
  const r = spawnSync(
    ffmpegPath,
    ['-y', '-i', audioPath, '-map', '0:a:0', '-c:a', 'pcm_s16le', wavPath],
    { encoding: 'utf8' },
  );
  return r.status === 0 && fs.existsSync(wavPath);
}

function buildUnderscoreFilter(durSeconds) {
  const fadeIn = Math.min(2, Math.max(1, durSeconds * 0.03));
  const fadeOut = Math.min(2, Math.max(1, durSeconds * 0.03));
  const fadeOutStart = Math.max(0, durSeconds - fadeOut);
  // Gentle bed (~20%); fade only at timeline start/end — no atempo/asetrate.
  return `[1:a]volume=0.20,atrim=0:${durSeconds.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fadeIn.toFixed(2)},afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${fadeOut.toFixed(2)}[aout]`;
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
let tmpWav = null;

if (!audioPath) {
  console.warn('No demo music found — encoding silent MP4');
  args = ['-y', '-i', input, ...videoArgs, '-an', output];
} else {
  const dur = probeDurationSeconds(input) || 0;
  tmpWav = path.join(os.tmpdir(), `ccd-demo-music-${process.pid}.wav`);
  if (!decodeMusicToWav(audioPath, tmpWav)) {
    console.error('Failed to decode demo music to WAV:', audioPath);
    process.exit(1);
  }
  const filter = buildUnderscoreFilter(dur);
  console.log(`Muxing background music: ${audioPath} (PCM loop to ${dur.toFixed(1)}s, vol=0.20)`);
  args = [
    '-y',
    '-i',
    input,
    '-stream_loop',
    '-1',
    '-i',
    tmpWav,
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
    '192k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-shortest',
    output,
  ];
}

const r = spawnSync(ffmpegPath, args, { stdio: 'inherit' });
if (tmpWav) fs.rmSync(tmpWav, { force: true });
process.exit(r.status ?? 1);
