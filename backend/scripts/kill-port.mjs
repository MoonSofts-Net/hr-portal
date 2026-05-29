/**
 * Free a TCP port (Windows + Unix). Usage: node scripts/kill-port.mjs 3001
 */
import { execSync } from 'child_process';
import { platform } from 'os';

const port = Number(process.argv[2] ?? process.env.PORT ?? 3001);

if (!port || port < 1 || port > 65535) {
  console.error('Usage: node scripts/kill-port.mjs <port>');
  process.exit(1);
}

function findPidsWindows(targetPort) {
  const out = execSync(`netstat -ano | findstr ":${targetPort}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const pids = new Set();
  for (const line of out.split('\n')) {
    if (!line.includes('LISTENING')) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1], 10);
    if (pid > 0) pids.add(pid);
  }
  return [...pids];
}

function findPidsUnix(targetPort) {
  try {
    const out = execSync(`lsof -ti :${targetPort}`, { encoding: 'utf8' });
    return out
      .split('\n')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n > 0);
  } catch {
    return [];
  }
}

const pids = platform() === 'win32' ? findPidsWindows(port) : findPidsUnix(port);

if (pids.length === 0) {
  console.log(`[port] Nothing listening on port ${port}`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    if (platform() === 'win32') {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    console.log(`[port] Stopped process ${pid} on port ${port}`);
  } catch (err) {
    console.warn(`[port] Could not stop PID ${pid}:`, err?.message ?? err);
  }
}
