import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_SECRET_KEY || 'vikaalam_crm_secure_master_encryption_key_2026_default';
  // Derive a 32-byte (256-bit) key using SHA-256
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts sensitive string using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex-encoded)
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';

  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // Might be plaintext legacy or unencrypted fallback
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt secret:', err);
    return '';
  }
}

/**
 * Masks a sensitive secret for safe frontend display.
 * Examples:
 * - "wa_live_3f9a7b8cD2xK1mNpQ4rS5tU6vW7xY8z9AbCdEf0123" -> "wa_live_••••••••0123"
 * - "cs_sec_891238912739" -> "••••••••••••2739"
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';

  if (secret.startsWith('wa_live_') || secret.startsWith('wa_test_')) {
    const prefix = secret.slice(0, 8); // 'wa_live_' or 'wa_test_'
    const suffix = secret.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  if (secret.length > 8) {
    const suffix = secret.slice(-4);
    return `••••••••••••${suffix}`;
  }

  return '••••••••';
}
