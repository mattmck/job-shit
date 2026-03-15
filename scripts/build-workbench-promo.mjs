#!/usr/bin/env node

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SCENES = [
  { file: '05-results-panel.png', duration: 5 },
  { file: '05-results-panel.png', duration: 5 },
  { file: '03-scoring-prompt-overview.png', duration: 6 },
  { file: '07-source-panel.png', duration: 6 },
  { file: '04-scoring-prompt-panel.png', duration: 7 },
  { file: '09-appearance-overview.png', duration: 6 },
  { file: '05-results-panel.png', duration: 9 },
  { file: '08-documents-overview.png', duration: 7 },
  { file: '11-export-actions-resume.png', duration: 5 },
  { file: '08-documents-overview.png', duration: 4 },
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(details || `${command} ${args.join(' ')} failed`);
  }

  return result.stdout.trim();
}

function ensureFfmpeg() {
  const result = spawnSync('bash', ['-lc', 'command -v ffmpeg >/dev/null 2>&1'], {
    cwd: repoRoot,
  });
  if (result.status !== 0) {
    throw new Error('ffmpeg is required. Install it first, then rerun `npm run video:promo`.');
  }
}

function parseArgs(argv) {
  return {
    shotsDir: resolve(repoRoot, 'output/playwright/workbench-shots'),
    output: resolve(repoRoot, 'output/video/workbench-promo-animatic.mp4'),
    fps: 30,
    width: 1920,
    height: 1080,
    ...Object.fromEntries(
      argv.reduce((pairs, arg, index) => {
        if (arg === '--shots-dir') {
          pairs.push(['shotsDir', resolve(repoRoot, argv[index + 1])]);
        }
        if (arg === '--output') {
          pairs.push(['output', resolve(repoRoot, argv[index + 1])]);
        }
        return pairs;
      }, []),
    ),
  };
}

function buildSegment(imagePath, outputPath, duration, width, height, fps) {
  run('ffmpeg', [
    '-y',
    '-loop', '1',
    '-i', imagePath,
    '-t', String(duration),
    '-vf',
    [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=#050814`,
      `fade=t=in:st=0:d=0.35`,
      `fade=t=out:st=${Math.max(0, duration - 0.35)}:d=0.35`,
      'format=yuv420p',
    ].join(','),
    '-r', String(fps),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    outputPath,
  ]);
}

function main() {
  ensureFfmpeg();
  const options = parseArgs(process.argv.slice(2));

  const outputDir = dirname(options.output);
  mkdirSync(outputDir, { recursive: true });

  for (const scene of SCENES) {
    const imagePath = join(options.shotsDir, scene.file);
    if (!existsSync(imagePath)) {
      throw new Error(`Missing screenshot: ${imagePath}\nRun \`npm run shots:workbench -- --headed\` first.`);
    }
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'workbench-promo-'));

  try {
    const segmentPaths = SCENES.map((scene, index) => join(tempDir, `${String(index + 1).padStart(2, '0')}.mp4`));
    SCENES.forEach((scene, index) => {
      buildSegment(
        join(options.shotsDir, scene.file),
        segmentPaths[index],
        scene.duration,
        options.width,
        options.height,
        options.fps,
      );
    });

    const concatFile = join(tempDir, 'segments.txt');
    writeFileSync(
      concatFile,
      segmentPaths.map((segmentPath) => `file '${segmentPath.replaceAll("'", "'\\''")}'`).join('\n'),
      'utf8',
    );

    run('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy',
      options.output,
    ]);

    console.log(options.output);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
