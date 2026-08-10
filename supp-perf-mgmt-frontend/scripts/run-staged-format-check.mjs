#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.css',
  '.cjs',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
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

function runPrettierCheck(files) {
  const args = ['prettier', '--check', ...files];

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

  throw new Error('Unable to execute npx for staged formatting check.');
}

try {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('No staged files requiring formatting check. Skipping.');
    process.exit(0);
  }

  console.log('Running Prettier check for staged files:');
  stagedFiles.forEach((file) => console.log(`- ${file}`));
  runPrettierCheck(stagedFiles);
} catch (error) {
  console.error('Failed to run staged formatting check.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
