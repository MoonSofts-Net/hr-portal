/**
 * Local PostgreSQL without Docker — uses embedded-postgres binaries.
 * Matches credentials in backend/.env (portal_rh / portal_rh_secret / portal_rh).
 *
 * Usage: npm run db:start
 * Safe to re-run: detects an already-running server on the configured port.
 */
import { loadBackendEnv } from './load-env.mjs';
import EmbeddedPostgres from 'embedded-postgres';

loadBackendEnv();
import { existsSync, readFileSync, unlinkSync } from 'fs';
import net from 'net';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const dataDir = join(backendRoot, 'data', 'postgres');

const USER = process.env.POSTGRES_USER ?? 'portal_rh';
const PASSWORD = process.env.POSTGRES_PASSWORD ?? 'portal_rh_secret';
const DB_NAME = process.env.POSTGRES_DB ?? 'portal_rh';
const PORT = Number(process.env.POSTGRES_PORT ?? 5432);

/** Set when this process started the server (so Ctrl+C can stop it). */
let managedInstance = null;

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(1500);
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function isClusterInitialized(dir) {
  return existsSync(join(dir, 'PG_VERSION'));
}

function isProcessRunning(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function removeStalePostmasterLock() {
  const pidFile = join(dataDir, 'postmaster.pid');
  if (!existsSync(pidFile)) return false;

  let pid;
  try {
    pid = parseInt(readFileSync(pidFile, 'utf8').split('\n')[0], 10);
  } catch {
    pid = NaN;
  }

  if (isProcessRunning(pid)) {
    return false;
  }

  console.log('[db] Removing stale postmaster.pid (previous server did not shut down cleanly)');
  unlinkSync(pidFile);
  return true;
}

function printReadyMessage({ alreadyRunning = false } = {}) {
  console.log('');
  if (alreadyRunning) {
    console.log(`[db] PostgreSQL is already running on localhost:${PORT}`);
  } else {
    console.log(`[db] Server listening on localhost:${PORT}`);
  }
  console.log('');
  console.log('  Connection URL:');
  console.log(`  postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB_NAME}?schema=public`);
  console.log('');
  console.log('  In another terminal:');
  console.log('    npm run db:setup   # first time only');
  console.log('    npm run start:dev');
  console.log('');
  if (!alreadyRunning) {
    console.log('  Press Ctrl+C in this terminal to stop the database.');
  } else {
    console.log('  Stop it with: npm run db:stop');
    console.log('  (Or close the terminal where db:start is still running.)');
  }
  console.log('');
}

async function ensureDatabase(pg) {
  try {
    await pg.createDatabase(DB_NAME);
    console.log(`[db] Database "${DB_NAME}" created`);
  } catch {
    /* already exists */
  }
}

async function main() {
  if (await isPortOpen('127.0.0.1', PORT)) {
    printReadyMessage({ alreadyRunning: true });
    process.exit(0);
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  if (!isClusterInitialized(dataDir)) {
    console.log('[db] Creating new database cluster (first run may download binaries)...');
    await pg.initialise();
  } else {
    console.log('[db] Using existing database cluster');
    removeStalePostmasterLock();
  }

  try {
    await pg.start();
  } catch (err) {
    if (await isPortOpen('127.0.0.1', PORT)) {
      printReadyMessage({ alreadyRunning: true });
      process.exit(0);
    }
    throw err;
  }

  managedInstance = pg;
  await ensureDatabase(pg);
  printReadyMessage({ alreadyRunning: false });

  // Keep process alive until Ctrl+C
  await new Promise(() => {});
}

async function shutdown() {
  console.log('\n[db] Stopping...');
  if (managedInstance) {
    try {
      await managedInstance.stop();
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  const msg = err?.message ?? String(err ?? 'Unknown error');
  console.error('[db] Failed to start:', msg);

  if (msg.includes('EADDRINUSE') || msg.includes('already exists')) {
    console.error(`Port ${PORT} may be in use. Try: npm run db:stop`);
  }
  if (msg.includes('postmaster.pid') || msg.includes('lock file')) {
    console.error('Try: npm run db:stop');
    console.error('Or delete backend/data/postgres/postmaster.pid if no Postgres is running.');
  }

  process.exit(1);
});
