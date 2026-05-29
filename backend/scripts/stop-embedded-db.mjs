/**
 * Stops embedded PostgreSQL started by start-embedded-db.mjs (Windows-friendly).
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data', 'postgres');
const pidFile = join(dataDir, 'postmaster.pid');

if (!existsSync(pidFile)) {
  console.log('[db] No postmaster.pid found — server may already be stopped.');
  process.exit(0);
}

let pid;
try {
  pid = parseInt(readFileSync(pidFile, 'utf8').split('\n')[0], 10);
} catch {
  console.error('[db] Could not read postmaster.pid');
  process.exit(1);
}

if (!pid || Number.isNaN(pid)) {
  unlinkSync(pidFile);
  console.log('[db] Removed invalid postmaster.pid');
  process.exit(0);
}

function killPid(targetPid) {
  return new Promise((resolve) => {
    if (platform() === 'win32') {
      const child = spawn('taskkill', ['/pid', String(targetPid), '/f', '/t'], {
        stdio: 'ignore',
      });
      child.on('close', () => resolve());
    } else {
      try {
        process.kill(targetPid, 'SIGTERM');
      } catch {
        /* already dead */
      }
      resolve();
    }
  });
}

await killPid(pid);

if (existsSync(pidFile)) {
  try {
    unlinkSync(pidFile);
  } catch {
    /* ignore */
  }
}

console.log(`[db] Stopped PostgreSQL (PID ${pid})`);
