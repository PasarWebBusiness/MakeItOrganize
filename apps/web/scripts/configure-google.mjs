import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(appDirectory, '.dev.vars');

function parseVariables(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function safeValue(value, label) {
  const clean = value.trim();
  if (!clean || /[\r\n]/.test(clean)) throw new Error(`${label} tidak valid.`);
  return clean;
}

let existing = new Map();
try {
  existing = parseVariables(await readFile(target, 'utf8'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const prompt = createInterface({ input: stdin, output: stdout });
try {
  stdout.write('Konfigurasi lokal Google OAuth MakeItOrganize\n');
  stdout.write('Nilai disimpan hanya ke apps/web/.dev.vars yang diabaikan Git.\n\n');
  const clientIdInput = await prompt.question(
    `Google OAuth Client ID${existing.has('GOOGLE_CLIENT_ID') ? ' (Enter untuk pertahankan)' : ''}: `,
  );
  const clientSecretInput = await prompt.question(
    `Google OAuth Client Secret${existing.has('GOOGLE_CLIENT_SECRET') ? ' (Enter untuk pertahankan)' : ''}: `,
  );
  const originInput = await prompt.question('Origin aplikasi lokal [http://localhost:3000]: ');
  const clientId = safeValue(clientIdInput || existing.get('GOOGLE_CLIENT_ID') || '', 'Client ID');
  const clientSecret = safeValue(clientSecretInput || existing.get('GOOGLE_CLIENT_SECRET') || '', 'Client Secret');
  const origin = safeValue(originInput || 'http://localhost:3000', 'Origin').replace(/\/$/, '');
  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    throw new Error('Client ID harus berasal dari OAuth client bertipe Web application.');
  }
  const originUrl = new URL(origin);
  const localHostname = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
  if (originUrl.origin !== origin || (!localHostname && originUrl.protocol !== 'https:')) {
    throw new Error('Origin harus berupa origin HTTPS tanpa path, atau localhost untuk development.');
  }
  const encryptionKey = existing.get('OAUTH_TOKEN_ENCRYPTION_KEY') || randomBytes(32).toString('base64');
  const geminiKey = existing.get('GEMINI_API_KEY') || '';
  const content = [
    '# Local-only secrets. Never commit this file.',
    `GOOGLE_CLIENT_ID=${clientId}`,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`,
    `GOOGLE_AUTH_REDIRECT_URI=${origin}/api/auth/google/callback`,
    `GOOGLE_INTEGRATION_REDIRECT_URI=${origin}/api/integrations/google/callback`,
    `OAUTH_TOKEN_ENCRYPTION_KEY=${encryptionKey}`,
    `GEMINI_API_KEY=${geminiKey}`,
    '',
  ].join('\n');
  await writeFile(target, content, { encoding: 'utf8', mode: 0o600 });
  stdout.write('\nKonfigurasi lokal tersimpan. Restart `npm run dev` sebelum menguji OAuth.\n');
  stdout.write(`Redirect login: ${origin}/api/auth/google/callback\n`);
  stdout.write(`Redirect integrasi: ${origin}/api/integrations/google/callback\n`);
} finally {
  prompt.close();
}
