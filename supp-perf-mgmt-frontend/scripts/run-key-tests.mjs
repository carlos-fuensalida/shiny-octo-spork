#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEST_MANIFEST_PATH = 'scripts/key-tests.txt';

function getManifestEntries() {
  const manifestPath = resolve(TEST_MANIFEST_PATH);

  if (!existsSync(manifestPath)) {
    throw new Error(`Test manifest not found: ${TEST_MANIFEST_PATH}`);
  }

  const content = readFileSync(manifestPath, 'utf8');

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('#'));
}

function validateEntries(entries) {
  const missingEntries = entries.filter((entry) => !existsSync(resolve(entry)));

  if (missingEntries.length > 0) {
    console.error('Key test manifest includes missing files:');
    missingEntries.forEach((entry) => console.error(`- ${entry}`));
    process.exit(1);
  }
}

function runKeyTests(entries) {
  const vitestCliPath = resolve('node_modules/vitest/vitest.mjs');
  const args = [vitestCliPath, 'run', ...entries];

  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

try {
  const testFiles = getManifestEntries();

  if (testFiles.length === 0) {
    console.log('No key tests are configured. Skipping key test suite.');
    process.exit(0);
  }

  validateEntries(testFiles);
  console.log('Running configured key tests:');
  testFiles.forEach((testFile) => console.log(`- ${testFile}`));

  runKeyTests(testFiles);
} catch (error) {
  console.error('Failed to run key tests.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
