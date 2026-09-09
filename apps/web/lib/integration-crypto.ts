const VERSION = 'v1';

function decodeKey(encodedKey: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(encodedKey), (character) => character.charCodeAt(0));
  if (bytes.byteLength !== 32) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return bytes;
}

async function importKey(encodedKey: string) {
  return crypto.subtle.importKey('raw', decodeKey(encodedKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptIntegrationSecret(value: string, encodedKey: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(encodedKey);
  const plaintext = new TextEncoder().encode(value);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return [VERSION, toBase64(iv), toBase64(ciphertext)].join('.');
}

export async function decryptIntegrationSecret(payload: string, encodedKey: string): Promise<string> {
  const [version, encodedIv, encodedCiphertext] = payload.split('.');
  if (version !== VERSION || !encodedIv || !encodedCiphertext) {
    throw new Error('Unsupported encrypted secret format');
  }
  const key = await importKey(encodedKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(encodedIv) },
    key,
    fromBase64(encodedCiphertext),
  );
  return new TextDecoder().decode(plaintext);
}

function toBase64(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
