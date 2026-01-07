import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
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
