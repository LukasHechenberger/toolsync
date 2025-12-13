import fs, { cp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, test, describe, beforeEach, rstest } from '@rstest/core';
import { existsSync } from 'node:fs';
import { init } from './init';

async function createTempDir() {
  const ostmpdir = os.tmpdir();
  const tmpdir = path.join(ostmpdir, 'unit-test-');

  return await fs.mkdtemp(tmpdir);
}

async function prepareFixture(name: string) {
  const fixtureDir = path.join('test/fixtures', name);
  const tmpdir = await createTempDir();

  await cp(fixtureDir, tmpdir, { recursive: true });

  console.debug(`Prepared fixture ${name} in temp dir ${tmpdir}...`);
  return tmpdir;
}

rstest.setConfig({ testTimeout: 60000 });

const originalCwd = process.cwd();
beforeEach(() => process.chdir(originalCwd));

describe('single package project', () => {
  test('init command works', async () => {
    const tempDir = await prepareFixture('single-package-project');

    await init({
      cwd: tempDir,
      force: false,
      useDefaults: false,
      versions: {
        '@toolsync/cli': `link:${originalCwd}`,
      },
    });

    const configPath = path.join(tempDir, 'toolsync.json');
    expect(existsSync(configPath), 'toolsync.json should exist').toBe(true);

    const config = await readFile(configPath, 'utf-8').then((data) => JSON.parse(data));
    expect(config, 'toolsync.json content').toEqual({});
  });
});

describe('monorepo project', () => {
  test('init command works', async () => {
    const tempDir = await prepareFixture('monorepo-project');

    await init({
      cwd: tempDir,
      force: false,
      useDefaults: false,
      versions: {
        '@toolsync/cli': `link:${originalCwd}`,
      },
    });

    const configPath = path.join(tempDir, 'toolsync.json');
    expect(existsSync(configPath), 'toolsync.json should exist').toBe(true);

    const config = await readFile(configPath, 'utf-8').then((data) => JSON.parse(data));
    expect(config, 'toolsync.json content').toEqual({});
  });
});
