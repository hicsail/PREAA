import crypto from 'crypto';
import { injectable } from 'tsyringe';

/**
 * AES-256-GCM symmetric encryption for secrets-at-rest in Mongo (LiteLLM
 * virtual keys, Langfuse secret keys, Langflow API keys per tenant). The
 * key comes from TENANT_PORTAL_ENCRYPTION_KEY env (32 bytes hex, generate
 * with `openssl rand -hex 32`).
 *
 * Encrypted values are stored as a 3-tuple { ciphertext, iv, tag }, all
 * base64-encoded. The auth tag is what makes GCM authenticated — if anyone
 * tampers with the ciphertext at rest, decrypt() throws.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM

export interface EncryptedValue {
  ciphertext: string; // base64
  iv: string;         // base64
  tag: string;        // base64
}

@injectable()
export class CryptoService {
  private getKey(): Buffer {
    const hex = process.env.TENANT_PORTAL_ENCRYPTION_KEY;
    if (!hex) {
      throw new Error(
        'TENANT_PORTAL_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32',
      );
    }
    if (hex.length !== 64) {
      throw new Error(
        `TENANT_PORTAL_ENCRYPTION_KEY must be 32 bytes hex (64 chars); got ${hex.length}`,
      );
    }
    return Buffer.from(hex, 'hex');
  }

  encrypt(plaintext: string): EncryptedValue {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  decrypt(enc: EncryptedValue): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.getKey(),
      Buffer.from(enc.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(enc.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(enc.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
