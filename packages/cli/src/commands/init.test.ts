import fs, { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, test, describe, beforeEach, rstest } from '@rstest/core';
import { BunTool, NpmTool, PnpmTool, YarnTool } from '@manypkg/tools';
import { existsSync, readFileSync } from 'node:fs';
import { init } from './init';
import { execa } from 'execa';

const originalCwd = process.cwd();

// MARK: Config
// NOTE: Set to a fixed directory for easier debugging
const fixedTestDir = undefined; // '/Users/lukas/Downloads/toolsync-test';

// MARK: Helpers

async function createTempDir() {
  if (fixedTestDir) {
    await rm(fixedTestDir, { recursive: true, force: true });
    await mkdir(fixedTestDir, { recursive: true });
    return fixedTestDir;
  }

  const ostmpdir = os.tmpdir();
  const tmpdir = path.join(ostmpdir, 'unit-test-');

  return await fs.mkdtemp(tmpdir);
}

const dependenciesToPrepare = {
  '@toolsync/cli': originalCwd,
  '@toolsync/core': path.join(originalCwd, '../core'),
  '@toolsync/builtin': path.join(originalCwd, '../builtin-tools'),
};

const packageManagers = [
  { type: 'pnpm', version: '10.11.1', tool: PnpmTool },
  { type: 'bun', version: '1.3.4', tool: BunTool },
  { type: 'npm', version: '10.9.3', tool: NpmTool },
  { type: 'yarn', version: '1.22.22', tool: YarnTool },
] as const;
type PackageManager = (typeof packageManagers)[number];

async function prepareFixture(name: string, packageManager: PackageManager) {
  const fixtureDir = path.join('test/fixtures', name);
  const tempDir = await createTempDir();

  await cp(fixtureDir, tempDir, { recursive: true });

  // Update root package.json
  const rootManifest = JSON.parse(readFileSync(path.join(tempDir, 'package.json'), 'utf-8'));

  rootManifest.packageManager = `${packageManager.type}@${packageManager.version}`;
  await writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(rootManifest, null, 2),
    'utf-8',
  );

  // Create config files
  if (packageManager.type === 'pnpm' && rootManifest.workspaces) {
    await writeFile(
      path.join(tempDir, 'pnpm-workspace.yaml'),
      JSON.stringify({ packages: rootManifest.workspaces }),
      'utf-8',
    );
  }

  // Pack cli package to a tarball and use that for testing
  let versions: Record<string, string> = {};
  for (const [pkg, pkgPath] of Object.entries(dependenciesToPrepare)) {
    const tarPath = path.join(tempDir, `${pkg.split('/').pop()}.tgz`);
    await execa('bun', ['pm', 'pack', '--filename', tarPath], { cwd: pkgPath });
    versions[pkg] = `file:${tarPath}`;
  }

  console.debug(`Prepared fixture ${name} in temp dir ${tempDir}...`);
  return {
    tempDir,
    versions,
  };
}

rstest.setConfig({ testTimeout: 60000 });

beforeEach(() => process.chdir(originalCwd));

describe.each(packageManagers)(`with $type`, (pm) => {
  // MARK: Unit tests

  describe('init', () => {
    test('throws with invalid cwd', async () => {
      await expect(
        init({ cwd: 'non-existent-dir' }),
        'init with invalid cwd should throw',
      ).rejects.toThrow('does not exist');
    });
  });

  // MARK: Integration tests

  describe('single package project', () => {
    test('init command works', async () => {
      const { tempDir, versions } = await prepareFixture('single-package-project', pm);

      await init({
        cwd: tempDir,
        useDefaults: false,
        versions,
      });

      const configPath = path.join(tempDir, 'toolsync.json');
      expect(existsSync(configPath), 'toolsync.json should exist').toBe(true);

      const config = await readFile(configPath, 'utf-8').then((data) => JSON.parse(data));
      expect(config, 'toolsync.json content').toEqual({});
      expect(pm.tool.isMonorepoRootSync(tempDir), 'should still be single package project').toBe(
        false,
      );
    });
  });

  describe('monorepo project', () => {
    test('init command works', async () => {
      const { tempDir, versions } = await prepareFixture('monorepo-project', pm);

      await init({
        cwd: tempDir,
        useDefaults: false,
        versions,
      });

      const configPath = path.join(tempDir, 'toolsync.json');
      expect(existsSync(configPath), 'toolsync.json should exist').toBe(true);

      const config = await readFile(configPath, 'utf-8').then((data) => JSON.parse(data));
      expect(config, 'toolsync.json content').toEqual({});
      expect(pm.tool.isMonorepoRootSync(tempDir), 'should be monorepo project').toBe(true);
    });
  });
});
