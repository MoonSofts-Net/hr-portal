/**
 * Verifies PostgreSQL is reachable before starting the API.
 */
import net from 'net';

const host = process.env.PGHOST ?? 'localhost';
const port = Number(process.env.PGPORT ?? 5432);

function probe() {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(2000);
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const ok = await probe();

if (!ok) {
  console.error('');
  console.error('  PostgreSQL is not running on', `${host}:${port}`);
  console.error('');
  console.error('  Start the database (pick one):');
  console.error('');
  console.error('    Option A — embedded (no Docker):');
  console.error('      npm run db:start');
  console.error('');
  console.error('    Option B — Docker:');
  console.error('      docker compose up postgres -d');
  console.error('');
  console.error('  Then apply schema and seed (first time only):');
  console.error('      npm run db:setup');
  console.error('');
  console.error('  See backend/docs/DATABASE_SETUP.md for details.');
  console.error('');
  process.exit(1);
}

console.log(`[db] PostgreSQL reachable at ${host}:${port}`);
