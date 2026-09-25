import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, '..');
const frontendDist = path.join(frontendRoot, 'dist');
const backendAppDist = path.resolve(frontendRoot, '../backend/app/dist');
const backendDist = path.resolve(frontendRoot, '../backend/dist');

if (!fs.existsSync(backendAppDist)) fs.mkdirSync(backendAppDist, { recursive: true });
if (!fs.existsSync(backendDist)) fs.mkdirSync(backendDist, { recursive: true });

fs.cpSync(frontendDist, backendAppDist, { recursive: true });
console.log(' Copied frontend/dist -> backend/app/dist');

fs.cpSync(frontendDist, backendDist, { recursive: true });
console.log(' Copied frontend/dist -> backend/dist');
