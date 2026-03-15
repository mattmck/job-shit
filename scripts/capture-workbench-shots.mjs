#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SHOWCASE_THEME = {
  background: '#FFF8F1',
  body: '#24313D',
  accent: '#C25B2B',
  subheading: '#486174',
  jobTitle: '#152233',
  date: '#2F6DA4',
  contact: '#33404A',
  link: '#195B8E',
};

const SHOWCASE_SOURCE = {
  company: 'OpenAI',
  jobTitle: 'Staff Product Engineer',
  jobDescription: [
    'Build polished workflow tooling for highly technical internal teams.',
    'Own prompt architecture, evaluation loops, and export-ready previews.',
    'Partner across engineering, design, and operations to ship trustworthy UX quickly.',
  ].join('\n'),
};

const SHOWCASE_HUNTR_JOBS = [
  {
    boardId: 'wish-01',
    id: 'job-openai-01',
    title: 'Staff Product Engineer',
    company: 'OpenAI',
    listName: 'Wishlist',
    descriptionText: SHOWCASE_SOURCE.jobDescription,
  },
  {
    boardId: 'wish-01',
    id: 'job-anthropic-02',
    title: 'Lead Internal Tools Engineer',
    company: 'Anthropic',
    listName: 'Wishlist',
    descriptionText: [
      'Lead workflow tooling for research and operations teams.',
      'Own quality signals, review loops, and polished browser interfaces.',
      'Partner across engineering and design on high-trust internal software.',
    ].join('\n'),
  },
  {
    boardId: 'wish-01',
    id: 'job-stripe-03',
    title: 'Principal Product Engineer',
    company: 'Stripe',
    listName: 'Wishlist',
    descriptionText: [
      'Build systems and interfaces that help operators move money and resolve issues safely.',
      'Combine product judgment, clear instrumentation, and strong frontend execution.',
    ].join('\n'),
  },
];

const SHOWCASE_DOCUMENTS = {
  resume: [
    '# Jane Doe',
    '',
    '## Summary',
    'Staff engineer focused on TypeScript platforms, internal tooling, and trustworthy workflow UX.',
    '',
    '## Experience',
    '### OpenAI',
    '**Staff Engineer, Platform & Workbench** | 2022 - Present',
    '- Built browser-based workflow tooling used by hundreds of operators across product, GTM, and recruiting teams.',
    '- Reduced turnaround time by 42% with richer previews, clearer score signals, and export-ready outputs.',
    '- Partnered with design to turn rough internal tooling into polished, credible, high-trust user experiences.',
    '',
    '### Acme',
    '**Senior Engineer, Developer Experience** | 2019 - 2022',
    '- Shipped TypeScript services and observability improvements across multi-region systems.',
    '- Mentored engineers through architecture reviews, pairing, and production-readiness work.',
  ].join('\n'),
  bio: [
    'Jane is a product-minded staff engineer who specializes in workflow tooling, TypeScript platforms, and UX that feels trustworthy under pressure.',
    '',
    'She is strongest at turning operational complexity into interfaces that are easier to navigate, review, and ship from.',
  ].join('\n'),
  coverLetter: [
    'OpenAI needs a builder who can turn rough internal workflows into a product that feels sharp, credible, and fast.',
    '',
    'That mix of engineering judgment, systems thinking, and visual polish is exactly the kind of work I do best.',
    '',
    'I have led TypeScript platform work, improved observability, and shipped user-facing tooling that helps teams move with more confidence.',
  ].join('\n'),
  supplemental: [
    '- Deep experience with TypeScript, Node.js, browser tooling, and prompt-driven workflow surfaces.',
    '- Strong track record partnering with design on high-signal internal products.',
    '- Comfortable owning the path from intake to export-ready output.',
  ].join('\n'),
};

const SHOWCASE_PROMPTS = {
  resumeSystem: [
    'You are a surgical resume editor for senior engineering roles.',
    '',
    'Goals:',
    '- Maximize evidence density without sounding inflated.',
    '- Prefer quantified outcomes over adjectives.',
    '- Preserve factual accuracy and verifiability.',
    '',
    'Constraints:',
    '- Keep markdown structure clean and ATS-safe.',
    '- Do not invent titles, dates, metrics, or technologies.',
    '- Favor concrete platform, systems, and product language.',
    '',
    'Output contract:',
    '1. Return markdown only.',
    '2. Retain strongest bullets near the top.',
    '3. Rewrite weak bullets to emphasize user or business impact.',
  ].join('\n'),
  coverLetterSystem: [
    'Write a concise, technical cover letter for a senior product-minded engineer.',
    '',
    'Focus areas:',
    '- Why this role is a precise fit',
    '- How the candidate balances systems thinking and UX polish',
    '- Evidence of execution across ambiguous, cross-functional work',
    '',
    'Constraints:',
    '- 3 short paragraphs maximum',
    '- No hype language or generic enthusiasm',
    '- Mention the company and role explicitly',
  ].join('\n'),
  scoringSystem: [
    'Evaluate the tailored output as both an ATS reviewer and a technical hiring panel.',
    '',
    'Return strict JSON with:',
    '{',
    '  "overall": number,',
    '  "atsCompatibility": number,',
    '  "recruiterClarity": number,',
    '  "hrClarity": number,',
    '  "aiObviousness": number,',
    '  "factualRisk": number,',
    '  "notes": string[]',
    '}',
    '',
    'Rubric:',
    '- Reward specificity, credible system-level impact, and fast skim value.',
    '- Penalize invented claims, filler, or vague leadership language.',
    '- Call out ATS gaps separately from voice or evidence issues.',
  ].join('\n'),
};

const SHOWCASE_RESUME_HTML = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; font-family: Georgia, "Times New Roman", serif; }
      .resume { padding: 36px 42px; min-height: 100vh; }
      h1 { margin: 0 0 4px; font-size: 30px; letter-spacing: 0.01em; }
      h2.section { margin: 26px 0 10px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; }
      h2.role { margin: 0; font-size: 18px; }
      h3 { margin: 0; font-size: 16px; }
      p { margin: 8px 0; line-height: 1.5; }
      p.contact, p.links, p.date { font-size: 12px; margin: 3px 0; }
      .job { margin-top: 16px; }
      .job-company { font-weight: 600; }
      ul { margin: 8px 0 0 18px; }
      li { margin-bottom: 7px; line-height: 1.45; }
    </style>
  </head>
  <body>
    <div class="resume">
      <h1>Jane Doe</h1>
      <p class="contact">jane@example.com | New York, NY | (555) 555-5555</p>
      <p class="links">linkedin.com/in/janedoe | github.com/janedoe</p>
      <h2 class="section">Summary</h2>
      <p>Staff engineer focused on TypeScript platforms, high-signal UX, and resilient cloud systems.</p>
      <h2 class="section">Experience</h2>
      <div class="job">
        <h3>Staff Engineer</h3>
        <h2 class="role">Platform & Workbench</h2>
        <p class="job-company">OpenAI</p>
        <p class="date">2022 - Present</p>
        <ul>
          <li>Built workflow tooling used by hundreds of operators across product, GTM, and recruiting teams.</li>
          <li>Cut turnaround time by 42% with faster review loops, richer previews, and export-ready outputs.</li>
          <li>Partnered across design and engineering to turn internal tools into polished, trustworthy experiences.</li>
        </ul>
      </div>
      <div class="job">
        <h3>Senior Engineer</h3>
        <h2 class="role">Developer Experience</h2>
        <p class="job-company">Acme</p>
        <p class="date">2019 - 2022</p>
        <ul>
          <li>Shipped TypeScript services and observability improvements across multi-region systems.</li>
          <li>Mentored engineers and improved release confidence with clearer quality signals.</li>
        </ul>
      </div>
    </div>
  </body>
</html>`;

const SHOWCASE_COVER_HTML = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; font-family: Georgia, "Times New Roman", serif; }
      .resume { padding: 40px 44px; min-height: 100vh; }
      h1 { margin: 0 0 16px; font-size: 28px; }
      p { margin: 0 0 14px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="resume">
      <h1>Cover Letter</h1>
      <p>OpenAI needs a builder who can turn rough internal workflows into a product that feels sharp, credible, and fast.</p>
      <p>That mix of engineering judgment, systems thinking, and visual polish is exactly the kind of work I do best.</p>
      <p>I have led TypeScript platform work, improved observability, and shipped user-facing tooling that helps teams move with more confidence.</p>
    </div>
  </body>
</html>`;

const SHOWCASE_RESULT = {
  output: {
    resume: [
      '# Jane Doe',
      '## Experience',
      '- Built workflow tooling used by hundreds of operators.',
      '- Cut turnaround time by 42% with richer previews.',
      '- Partnered across design and engineering to ship polished internal tools.',
    ].join('\n'),
    coverLetter: [
      'OpenAI needs a builder who can turn rough workflows into a product that feels sharp, credible, and fast.',
      '',
      'That mix of engineering judgment and visual polish is where I do my best work.',
    ].join('\n'),
  },
  artifacts: {
    resumeHtml: SHOWCASE_RESUME_HTML,
    coverLetterHtml: SHOWCASE_COVER_HTML,
  },
  scorecard: {
    heuristic: {
      overall: 92,
      keywordAlignment: 89,
      structure: 90,
      quantifiedImpact: 86,
      coverLetterSpecificity: 91,
      aiObviousnessRisk: 18,
      matchedKeywords: ['TypeScript', 'workflow tooling', 'preview', 'internal teams', 'observability', 'platform'],
      missingKeywords: ['experimentation'],
      warnings: [
        'Add one more product outcome tied directly to operator efficiency.',
        'Resume bullets are strong; one could be even more specific about stakeholder impact.',
        'Cover letter feels tailored and believable, with low templated-language risk.',
      ],
    },
    evaluator: {
      overall: 90,
      atsCompatibility: 87,
      recruiterClarity: 93,
      hrClarity: 88,
      aiObviousness: 84,
      factualRisk: 91,
      notes: [
        'Strong alignment with the role and clear evidence of systems thinking.',
        'Preview reads as polished and easy to skim.',
        'Could add one more quantified outcome in the top experience block.',
      ],
    },
  },
};

const SHOTS = [
  {
    file: '01-resume-prompt-overview.png',
    title: 'Resume Prompt Overview',
    description: 'Full workbench frame with the resume prompt and rendered resume preview.',
    tab: 'prompts',
    promptTab: 'resume',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'page',
  },
  {
    file: '02-cover-prompt-overview.png',
    title: 'Cover Prompt Overview',
    description: 'Full workbench frame with the cover-letter prompt and rendered cover preview.',
    tab: 'prompts',
    promptTab: 'cover',
    resultDoc: 'cover',
    viewerPrefix: 'cover',
    viewer: 'preview',
    target: 'page',
  },
  {
    file: '03-scoring-prompt-overview.png',
    title: 'Scoring Prompt Overview',
    description: 'Full workbench frame with the scoring rubric visible beside the scorecards and resume preview.',
    tab: 'prompts',
    promptTab: 'scoring',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'page',
  },
  {
    file: '04-scoring-prompt-panel.png',
    title: 'Scoring Prompt Panel',
    description: 'Tight shot of the input panel with the scoring prompt selected.',
    tab: 'prompts',
    promptTab: 'scoring',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'inputs',
  },
  {
    file: '05-results-panel.png',
    title: 'Results Panel',
    description: 'Tight shot of the results section with scorecards, findings, and preview.',
    tab: 'prompts',
    promptTab: 'scoring',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'results',
  },
  {
    file: '06-source-huntr-overview.png',
    title: 'Source Huntr Overview',
    description: 'Full workbench frame with populated source fields and a staged Huntr wishlist.',
    tab: 'docs',
    docTab: 'resume',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'page',
    sourceStatus: 'Loaded 3 Huntr wishlist jobs and selected OpenAI role.',
    runStatus: 'Workspace staged for a Huntr-driven tailoring pass.',
    activity: 'Source intake staged with a Huntr wishlist selection.',
  },
  {
    file: '07-source-panel.png',
    title: 'Source Panel',
    description: 'Tight shot of the source section with Huntr jobs, job description, and provider routing.',
    tab: 'docs',
    docTab: 'resume',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'source',
    sourceStatus: 'Selected Huntr job job-openai-01 from board wish-01.',
    runStatus: 'Ready to run the selected Huntr job.',
    activity: 'Source panel staged for promo capture.',
  },
  {
    file: '08-documents-overview.png',
    title: 'Documents Overview',
    description: 'Full workbench frame with the documents tab active and the resume editor visible.',
    tab: 'docs',
    docTab: 'resume',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'page',
    activity: 'Documents tab staged with local materials loaded.',
  },
  {
    file: '09-appearance-overview.png',
    title: 'Appearance Overview',
    description: 'Full workbench frame with the appearance tab active and rendered preview visible.',
    tab: 'appearance',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'page',
    activity: 'Appearance controls staged with live preview.',
  },
  {
    file: '10-appearance-panel.png',
    title: 'Appearance Panel',
    description: 'Tight shot of the appearance controls used to tune the exported resume palette.',
    tab: 'appearance',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'inputs',
    activity: 'Appearance panel staged for promo capture.',
  },
  {
    file: '11-export-actions-resume.png',
    title: 'Resume Export Actions',
    description: 'Tight shot of the results section with resume export actions and preview visible.',
    tab: 'prompts',
    promptTab: 'resume',
    resultDoc: 'resume',
    viewerPrefix: 'resume',
    viewer: 'preview',
    target: 'results',
    activity: 'Resume export actions staged with rendered preview.',
  },
  {
    file: '12-export-actions-cover.png',
    title: 'Cover Export Actions',
    description: 'Tight shot of the results section with cover-letter export actions and preview visible.',
    tab: 'prompts',
    promptTab: 'cover',
    resultDoc: 'cover',
    viewerPrefix: 'cover',
    viewer: 'preview',
    target: 'results',
    activity: 'Cover-letter export actions staged with rendered preview.',
  },
];

function printHelp() {
  console.log(`Capture promo-ready workbench screenshots with the Playwright CLI wrapper.

Usage:
  npm run shots:workbench
  npm run shots:workbench -- --headed
  npm run shots:workbench -- --dir output/playwright/my-pack
  npm run shots:workbench -- --url http://127.0.0.1:4312

Options:
  --dir <path>    Output directory. Defaults to output/playwright/workbench-shots
  --url <url>     Use an existing workbench URL instead of starting a local server
  --port <port>   Port to use when starting a local server (default: 4312)
  --headed        Open a headed browser while capturing
  --help          Show this help text
`);
}

function parseArgs(argv) {
  const options = {
    dir: resolve(repoRoot, 'output/playwright/workbench-shots'),
    url: process.env.WORKBENCH_URL || '',
    port: Number(process.env.WORKBENCH_PORT || process.env.PORT || 4312),
    headed: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
    if (arg === '--headed') {
      options.headed = true;
      continue;
    }
    if (arg === '--dir') {
      options.dir = resolve(repoRoot, argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--url') {
      options.url = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--port') {
      options.port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function hasCommand(command) {
  const result = spawnSync('bash', ['-lc', `command -v ${command} >/dev/null 2>&1`], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

function resolvePlaywrightCli() {
  if (!hasCommand('npx')) {
    throw new Error('`npx` is required for the Playwright CLI wrapper. Install Node.js/npm first.');
  }

  if (process.env.PWCLI) {
    return process.env.PWCLI;
  }

  const codexHome = process.env.CODEX_HOME || join(process.env.HOME || '', '.codex');
  const wrapper = join(codexHome, 'skills', 'playwright', 'scripts', 'playwright_cli.sh');
  if (existsSync(wrapper)) {
    return wrapper;
  }

  if (hasCommand('playwright-cli')) {
    return 'playwright-cli';
  }

  throw new Error(
    'Could not find the Playwright CLI wrapper. Install the `playwright` skill or set PWCLI to the wrapper path.',
  );
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(details || `${command} ${args.join(' ')} failed.`);
  }

  if (result.stdout.includes('### Error')) {
    throw new Error(result.stdout.trim());
  }

  return result.stdout.trim();
}

async function waitForReady(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/ready', url));
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling while the server starts.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));
  }
  throw new Error(`Timed out waiting for ${url} to respond on /ready.`);
}

function startWorkbenchServer(port) {
  const child = spawn('npm', ['run', 'serve'], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: 'pipe',
  });

  let logs = '';
  const append = (chunk) => {
    logs += chunk.toString();
    if (logs.length > 8000) {
      logs = logs.slice(-8000);
    }
  };

  child.stdout.on('data', append);
  child.stderr.on('data', append);

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      process.stderr.write(logs);
    }
  });

  return {
    child,
    getLogs: () => logs,
  };
}

function buildStageExpression(shot) {
  const payload = {
    source: SHOWCASE_SOURCE,
    jobs: SHOWCASE_HUNTR_JOBS,
    documents: SHOWCASE_DOCUMENTS,
    prompts: SHOWCASE_PROMPTS,
    theme: SHOWCASE_THEME,
    result: SHOWCASE_RESULT,
    tab: shot.tab || 'prompts',
    docTab: shot.docTab || 'resume',
    promptTab: shot.promptTab,
    resultDoc: shot.resultDoc,
    viewerPrefix: shot.viewerPrefix,
    viewer: shot.viewer,
    sourceStatus: shot.sourceStatus || 'Showcase job loaded for screenshot capture.',
    runStatus: shot.runStatus || 'Promo-ready showcase result staged.',
    activity: shot.activity || `${shot.title} staged.`,
  };

  return `stageWorkbenchShowcase(${JSON.stringify(payload)})`;
}

function extractArtifactPath(output, extension) {
  const match = output.match(new RegExp(`\\]\\(([^)]+\\.${extension})\\)`));
  if (!match) {
    throw new Error(`Could not find a .${extension} artifact path in Playwright output:\n${output}`);
  }
  return resolve(repoRoot, match[1]);
}

function snapshotPath(output) {
  return extractArtifactPath(output, 'yml');
}

function screenshotPath(output) {
  return extractArtifactPath(output, 'png');
}

function indentOf(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function findSectionRef(snapshotFile, heading) {
  const lines = readFileSync(snapshotFile, 'utf8').split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.includes(`heading "${heading}"`));

  if (headingIndex === -1) {
    throw new Error(`Could not find heading "${heading}" in ${snapshotFile}.`);
  }

  const headingIndent = indentOf(lines[headingIndex]);
  for (let index = headingIndex - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const match = line.match(/\[ref=([^\]]+)\]/);
    if (match && indentOf(line) < headingIndent) {
      return match[1];
    }
  }

  throw new Error(`Could not find a section ref for heading "${heading}" in ${snapshotFile}.`);
}

function moveScreenshot(tempPath, targetPath) {
  mkdirSync(dirname(targetPath), { recursive: true });
  rmSync(targetPath, { force: true });
  renameSync(tempPath, targetPath);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const pwcli = resolvePlaywrightCli();
  const session = `wbs${process.pid}`;
  const baseUrl = options.url || `http://127.0.0.1:${options.port}`;
  let server = null;
  let startedServer = false;

  mkdirSync(options.dir, { recursive: true });
  rmSync(join(options.dir, 'manifest.json'), { force: true });

  try {
    try {
      await waitForReady(baseUrl, 1200);
    } catch {
      if (options.url) {
        throw new Error(`Could not reach ${baseUrl}. Start the workbench first or omit --url.`);
      }

      server = startWorkbenchServer(options.port);
      startedServer = true;
      await waitForReady(baseUrl, 20000);
    }

    const env = { PLAYWRIGHT_CLI_SESSION: session };
    const openArgs = ['open', baseUrl];
    if (options.headed) {
      openArgs.push('--headed');
    }

    runCommand(pwcli, openArgs, { env });
    runCommand(pwcli, ['resize', '1728', '1117'], { env });

    const manifest = [];

    for (const shot of SHOTS) {
      const targetPath = join(options.dir, shot.file);
      runCommand(pwcli, ['eval', buildStageExpression(shot)], { env });
      const snapshotOutput = runCommand(pwcli, ['snapshot'], { env });
      const currentSnapshot = snapshotPath(snapshotOutput);

      let captureOutput;
      if (shot.target === 'source') {
        captureOutput = runCommand(pwcli, ['screenshot', findSectionRef(currentSnapshot, 'Source')], { env });
      } else if (shot.target === 'inputs') {
        captureOutput = runCommand(pwcli, ['screenshot', findSectionRef(currentSnapshot, 'Inputs')], { env });
      } else if (shot.target === 'results') {
        captureOutput = runCommand(pwcli, ['screenshot', findSectionRef(currentSnapshot, 'Results')], { env });
      } else {
        captureOutput = runCommand(pwcli, ['screenshot'], { env });
      }

      moveScreenshot(screenshotPath(captureOutput), targetPath);

      manifest.push({
        file: shot.file,
        title: shot.title,
        description: shot.description,
      });

      console.log(targetPath);
    }

    writeFileSync(join(options.dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(join(options.dir, 'manifest.json'));
  } catch (error) {
    if (startedServer && server) {
      throw new Error(`${error.message}\n\nWorkbench server logs:\n${server.getLogs().trim()}`);
    }
    throw error;
  } finally {
    try {
      runCommand(pwcli, ['close'], { env: { PLAYWRIGHT_CLI_SESSION: session } });
    } catch {
      // Ignore cleanup errors if the browser never opened.
    }

    if (server) {
      server.child.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
