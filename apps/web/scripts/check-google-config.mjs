import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(appDirectory, '.dev.vars');

function parseVariables(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }
  return values;
}

function requireValue(values, name) {
  const value = values.get(name);
  if (!value) throw new Error(`${name} belum diisi.`);
  return value;
}

function validateRedirect(value, expectedPath, label) {
  const url = new URL(value);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if ((!local && url.protocol !== 'https:') || url.pathname !== expectedPath || url.search || url.hash) {
    throw new Error(`${label} harus memakai HTTPS (kecuali localhost) dan path ${expectedPath}.`);
  }
  return url;
}

try {
  const values = parseVariables(await readFile(target, 'utf8'));
  const clientId = requireValue(values, 'GOOGLE_CLIENT_ID');
  requireValue(values, 'GOOGLE_CLIENT_SECRET');
  const authRedirect = validateRedirect(
    requireValue(values, 'GOOGLE_AUTH_REDIRECT_URI'),
    '/api/auth/google/callback',
    'GOOGLE_AUTH_REDIRECT_URI',
  );
  const integrationRedirect = validateRedirect(
    requireValue(values, 'GOOGLE_INTEGRATION_REDIRECT_URI'),
    '/api/integrations/google/callback',
    'GOOGLE_INTEGRATION_REDIRECT_URI',
  );
  const encryptionKey = requireValue(values, 'OAUTH_TOKEN_ENCRYPTION_KEY');

  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    throw new Error('GOOGLE_CLIENT_ID bukan OAuth client bertipe Web application.');
  }
  if (authRedirect.origin !== integrationRedirect.origin) {
    throw new Error('Kedua redirect URI harus memakai origin yang sama.');
  }
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encryptionKey) || Buffer.from(encryptionKey, 'base64').length !== 32) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY harus base64 32 byte.');
  }

  process.stdout.write('Google OAuth configuration: siap\n');
  process.stdout.write(`Origin: ${authRedirect.origin}\n`);
  process.stdout.write('Scopes login: openid email profile\n');
  process.stdout.write('Secret values: ditemukan dan tidak ditampilkan\n');
} catch (error) {
  const detail = error?.code === 'ENOENT'
    ? 'apps/web/.dev.vars belum ada. Jalankan `npm run google:setup` terlebih dahulu.'
    : error instanceof Error
      ? error.message
      : 'Konfigurasi tidak valid.';
  process.stderr.write(`Google OAuth configuration: belum siap\n${detail}\n`);
  process.exitCode = 1;
}
