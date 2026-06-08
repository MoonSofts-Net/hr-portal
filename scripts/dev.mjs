/**
 * Start or stop the full Portal RH dev stack (DB + API + frontend).
 *
 * Usage:
 *   node scripts/dev.mjs start   # default
 *   node scripts/dev.mjs stop
 */
import { spawn, spawnSync } from "child_process";
import net from "net";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const backendDir = join(rootDir, "backend");

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT ?? 3000);
const API_PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const DB_PORT = Number(process.env.PGPORT ?? 5432);

/** @type {import('child_process').ChildProcess[]} */
const children = [];
let shuttingDown = false;

function log(prefix, message) {
  console.log(`${prefix} ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runNodeScript(scriptPath, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(1500);
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, label, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen("127.0.0.1", port)) return;
    await sleep(400);
  }
  throw new Error(`${label} did not start on port ${port} within ${timeoutMs / 1000}s`);
}

async function waitForHttp(url, label, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

function prefixStream(stream, prefix) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length > 0) console.log(`${prefix} ${line}`);
    }
  });
  stream.on("end", () => {
    if (buffer.length > 0) console.log(`${prefix} ${buffer}`);
  });
}

function spawnService(name, command, args, cwd) {
  const prefix = `[${name}]`;
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  children.push(child);
  prefixStream(child.stdout, prefix);
  prefixStream(child.stderr, prefix);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (code === 0 && signal == null) return;
    console.error(`${prefix} exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    shutdown(1).catch(() => process.exit(1));
  });

  return child;
}

async function stopAll({ quiet = false } = {}) {
  shuttingDown = true;

  if (!quiet) log("[dev]", "Stopping services...");

  runNodeScript(join(backendDir, "scripts", "kill-port.mjs"), [String(FRONTEND_PORT)]);
  runNodeScript(join(backendDir, "scripts", "kill-port.mjs"), [String(API_PORT)]);
  runNodeScript(join(backendDir, "scripts", "stop-embedded-db.mjs"));

  for (const child of children) {
    if (!child.pid || child.killed) continue;
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/f", "/t"], { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      /* ignore */
    }
  }

  children.length = 0;
  if (!quiet) log("[dev]", "All services stopped.");
}

async function startAll() {
  log("[dev]", "Clearing previous dev servers...");
  await stopAll({ quiet: true });
  shuttingDown = false;

  console.log("");
  log("[dev]", "Starting Portal RH dev stack...");
  log("[dev]", `Frontend http://localhost:${FRONTEND_PORT}`);
  log("[dev]", `API       http://localhost:${API_PORT}/api/v1`);
  log("[dev]", `Database  localhost:${DB_PORT}`);
  console.log("");

  log("[dev]", "Starting PostgreSQL...");
  spawnService("db", "npm", ["run", "db:start"], backendDir);

  await waitForPort(DB_PORT, "PostgreSQL");
  log("[dev]", "PostgreSQL is ready.");

  log("[dev]", "Starting API...");
  spawnService("api", "npm", ["run", "start:dev"], backendDir);

  await waitForHttp(`http://127.0.0.1:${API_PORT}/api/v1/health`, "API");
  log("[dev]", "API is ready.");

  log("[dev]", "Starting frontend...");
  spawnService("web", "npm", ["run", "dev:frontend"], rootDir);

  await waitForPort(FRONTEND_PORT, "Frontend");
  console.log("");
  log("[dev]", "Ready. Open http://localhost:3000/login");
  log("[dev]", "Press Ctrl+C to stop all services.");
  console.log("");
}

async function shutdown(exitCode = 0) {
  if (shuttingDown && exitCode === 0) return;
  await stopAll();
  process.exit(exitCode);
}

process.on("SIGINT", () => {
  shutdown(0).catch(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown(0).catch(() => process.exit(0));
});

const command = process.argv[2] ?? "start";

try {
  if (command === "stop") {
    await stopAll();
    process.exit(0);
  }

  if (command === "start") {
    await startAll();
    await new Promise(() => {});
  } else {
    console.error("Usage: node scripts/dev.mjs [start|stop]");
    process.exit(1);
  }
} catch (err) {
  console.error("[dev] Failed:", err?.message ?? err);
  await shutdown(1);
}
