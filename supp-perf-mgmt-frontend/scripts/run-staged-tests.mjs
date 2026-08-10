#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]);

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
  });

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => {
      const extension = file.slice(file.lastIndexOf('.'));
      return SUPPORTED_EXTENSIONS.has(extension);
    })
    .filter((file) => existsSync(resolve(file)));
}

function runRelatedTests(files) {
  const args = ['vitest', 'related', '--run', ...files];

  const candidates =
    process.platform === 'win32' ? ['npx', 'npx.cmd'] : ['npx'];

  for (const command of candidates) {
    const result = spawnSync(command, args, {
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

  throw new Error('Unable to execute npx for staged related tests.');
}

try {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('No staged source files found. Skipping staged related tests.');
    process.exit(0);
  }

  console.log('Running related tests for staged files:');
  stagedFiles.forEach((file) => console.log(`- ${file}`));
  runRelatedTests(stagedFiles);
} catch (error) {
  console.error('Failed to run staged related tests.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
