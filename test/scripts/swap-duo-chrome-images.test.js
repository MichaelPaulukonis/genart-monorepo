import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, '../../scripts/swap-duo-chrome-images.js');

describe('swap-duo-chrome-images.js CLI Refactor', () => {
  it('should support --help flag', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--help']);
    expect(result.stdout.toString()).toContain('Usage:');
    // commander automatically adds help
    expect(result.stdout.toString()).toContain('--source');
  });

  it('should support --source and --target with --dry-run', () => {
    const result = spawnSync('node', [
      SCRIPT_PATH, 
      '--source', 'images_main', 
      '--target', 'images', 
      '--dry-run'
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toContain('Dry run:');
    expect(result.stdout.toString()).toContain('images_main');
    expect(result.stdout.toString()).toContain('images');
  });

  it('should fail if source directory does not exist', () => {
    const result = spawnSync('node', [
      SCRIPT_PATH,
      '--source', 'non_existent_folder',
      '--target', 'images'
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr.toString()).toContain('Error: Source directory "non_existent_folder" does not exist');
  });

  it('should copy files from source to target and keep source untouched', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'swap-test-'));
    const publicDir = path.join(tmpDir, 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    
    const sourceDirName = 'src_images';
    const targetDirName = 'images';
    const sourceDir = path.join(publicDir, sourceDirName);
    const targetDir = path.join(publicDir, targetDirName);
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, 'test.txt'), 'hello');

    const result = spawnSync('node', [
      SCRIPT_PATH,
      '--source', sourceDirName,
      '--target', targetDirName
    ], {
      env: { ...process.env, DUO_CHROME_PUBLIC_DIR: publicDir }
    });

    if (result.status !== 0) {
      console.error(result.stderr.toString());
      console.log(result.stdout.toString());
    }

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(targetDir, 'test.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, 'test.txt'), 'utf8')).toBe('hello');
    // Source should remain untouched
    expect(fs.existsSync(path.join(sourceDir, 'test.txt'))).toBe(true);
    
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should still support legacy "work" mode (backward compatibility)', () => {
    const result = spawnSync('node', [SCRIPT_PATH, 'work', '--dry-run']);
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toContain('mode: work');
  });

  it('should still support legacy "commit" mode (backward compatibility)', () => {
    const result = spawnSync('node', [SCRIPT_PATH, 'commit', '--dry-run']);
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toContain('mode: commit');
  });
});
