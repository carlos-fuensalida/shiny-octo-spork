#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';

// Vitest renders components in isolation (jsdom) and never runs Next.js's
// Server/Client Component boundary check — only `next build` (or the dev
// server) actually walks the import graph and catches things like a missing
// 'use client' on a file that gained a hook. That check only matters for
// changes under these two directories.
const RELEVANT_PREFIXES = ['src/app/', 'src/components/'];

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
  });

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function touchesRscBoundary(files) {
  return files.some((file) =>
    RELEVANT_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
}

function runBuild() {
  const candidates =
    process.platform === 'win32' ? ['npm', 'npm.cmd'] : ['npm'];

  for (const command of candidates) {
    const result = spawnSync(command, ['run', 'build'], {
      stdio: 'inherit',
      shell: process.platform === 'win32' && command.endsWith('.cmd'),
    });

    if (!result.error) {
      process.exit(result.status ?? 1);
    }

    if (result.error.code !== 'ENOENT' && result.error.code !== 'EINVAL') {
      throw result.error;
    }
  }

  throw new Error('Unable to execute npm for the conditional build check.');
}

try {
  const stagedFiles = getStagedFiles();

  if (!touchesRscBoundary(stagedFiles)) {
    console.log(
      'No staged changes under src/app/ or src/components/. Skipping the build check.',
    );
    process.exit(0);
  }

  console.log(
    'Staged changes touch src/app/ or src/components/ — running a full build to catch Server/Client Component boundary errors:',
  );
  runBuild();
} catch (error) {
  console.error('Failed to run the conditional build check.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
