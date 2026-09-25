import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, '..');
const frontendDist = path.join(frontendRoot, 'dist');

const backendApp = path.resolve(frontendRoot, '../backend/app');
const backendAppDist = path.join(backendApp, 'dist');
const backendAppVersion = path.join(backendApp, 'version');

const backendRoot = path.resolve(frontendRoot, '../backend');
const backendDist = path.join(backendRoot, 'dist');
const backendVersion = path.join(backendRoot, 'version');

// ─────────────────────────────────────────────────────────────────────────────
// Ensure Version Backup Directories Exist
// ─────────────────────────────────────────────────────────────────────────────
if (!fs.existsSync(backendAppVersion)) {
  fs.mkdirSync(backendAppVersion, { recursive: true });
}
if (!fs.existsSync(backendVersion)) {
  fs.mkdirSync(backendVersion, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculate Next Version Filename
// ─────────────────────────────────────────────────────────────────────────────
function getNextVersion() {
  const files = fs.existsSync(backendAppVersion) ? fs.readdirSync(backendAppVersion) : [];
  let max = 0;

  files.forEach((file) => {
    const match = file.match(/^build-v0\.0\.(\d+)_/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  return `build-v0.0.${max + 1}_${dateStr}_${timeStr}.zip`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup Old Build
// ─────────────────────────────────────────────────────────────────────────────
function backupOldBuild() {
  const sourceDist = fs.existsSync(backendAppDist)
    ? backendAppDist
    : fs.existsSync(backendDist)
    ? backendDist
    : null;

  if (!sourceDist) {
    console.log('ℹ  No previous backend dist found to backup.');
    return;
  }

  const zipName = getNextVersion();
  const zipPath = path.join(backendAppVersion, zipName);

  console.log(` Creating Backup: ${zipName}`);
  try {
    execSync(`tar -a -c -f "${zipPath}" -C "${sourceDist}" .`, {
      stdio: 'inherit',
      shell: true,
      timeout: 15000,
    });
    console.log(' Backup Created Successfully.');
  } catch (e) {
    console.warn('  Could not create zip backup (tar skipped):', e.message);
  }
}

function removeOldBuild() {
  try {
    if (fs.existsSync(backendAppDist)) {
      const files = fs.readdirSync(backendAppDist);
      for (const file of files) {
        fs.rmSync(path.join(backendAppDist, file), { recursive: true, force: true });
      }
      console.log(' Old backend/app/dist cleaned.');
    }
  } catch (e) {
    console.warn('  Could not fully remove old backend/app/dist (in use), will overwrite:', e.message);
  }

  try {
    if (fs.existsSync(backendDist)) {
      const files = fs.readdirSync(backendDist);
      for (const file of files) {
        fs.rmSync(path.join(backendDist, file), { recursive: true, force: true });
      }
      console.log(' Old backend/dist cleaned.');
    }
  } catch (e) {
    console.warn('  Could not fully remove old backend/dist (in use), will overwrite:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Production Vite Build
// ─────────────────────────────────────────────────────────────────────────────
function buildFrontend() {
  console.log(' Running production build (vite build --mode prod)...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} run build:bundle`, {
    cwd: frontendRoot,
    stdio: 'inherit',
    shell: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy Build to Backend Dist Locations
// ─────────────────────────────────────────────────────────────────────────────
function copyBuild() {
  if (!fs.existsSync(frontendDist)) {
    throw new Error(`Frontend dist folder not found at: ${frontendDist}`);
  }

  // Copy to backend/app/dist
  if (!fs.existsSync(backendAppDist)) {
    fs.mkdirSync(backendAppDist, { recursive: true });
  }
  fs.cpSync(frontendDist, backendAppDist, { recursive: true });
  console.log(' Build copied to backend/app/dist.');

  // Copy to backend/dist as well for compatibility
  if (!fs.existsSync(backendDist)) {
    fs.mkdirSync(backendDist, { recursive: true });
  }
  fs.cpSync(frontendDist, backendDist, { recursive: true });
  console.log(' Build copied to backend/dist.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Execution Pipeline
// ─────────────────────────────────────────────────────────────────────────────
try {
  console.log('=============================================');
  console.log('  Starting Production Build Pipeline (PAPG)');
  console.log('=============================================');
  backupOldBuild();
  removeOldBuild();
  buildFrontend();
  copyBuild();

  console.log('');
  console.log('=============================================');
  console.log(' Production Build & Dist Deployment Completed Successfully!');
  console.log('=============================================');
} catch (err) {
  console.error(' Build Pipeline Failed:', err);
  process.exit(1);
}
