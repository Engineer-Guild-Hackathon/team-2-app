export class EncryptionService {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  /**
   * Generate a cryptographic key for encryption/decryption
   */
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random salt
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate a random initialization vector (IV)
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(data: string, key: CryptoKey): Promise<{
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
  }> {
    const iv = this.generateIV();
    const encodedData = this.encoder.encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    return { encryptedData, iv };
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    return this.decoder.decode(decryptedData);
  }

  /**
   * Export a key to raw format
   */
  async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey('raw', key);
  }

  /**
   * Import a key from raw format
   */
  async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM'
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert Uint8Array to Base64 string
   */
  uint8ArrayToBase64(array: Uint8Array): string {
    return this.arrayBufferToBase64(array.buffer);
  }

  /**
   * Convert Base64 string to Uint8Array
   */
  base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(this.base64ToArrayBuffer(base64));
  }

  /**
   * Create an encrypted backup package
   */
  async createEncryptedBackup(data: string, password: string): Promise<{
    encryptedData: string; // Base64
    salt: string; // Base64
    iv: string; // Base64
    version: string;
  }> {
    const salt = this.generateSalt();
    const key = await this.deriveKeyFromPassword(password, salt);
    const { encryptedData, iv } = await this.encrypt(data, key);

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      salt: this.uint8ArrayToBase64(salt),
      iv: this.uint8ArrayToBase64(iv),
      version: '1.0'
    };
  }

  /**
   * Decrypt an encrypted backup package
   */
  async decryptBackup(encryptedPackage: {
    encryptedData: string;
    salt: string;
    iv: string;
    version: string;
  }, password: string): Promise<string> {
    if (encryptedPackage.version !== '1.0') {
      throw new Error(`Unsupported encryption version: ${encryptedPackage.version}`);
    }

    const salt = this.base64ToUint8Array(encryptedPackage.salt);
    const iv = this.base64ToUint8Array(encryptedPackage.iv);
    const encryptedData = this.base64ToArrayBuffer(encryptedPackage.encryptedData);

    const key = await this.deriveKeyFromPassword(password, salt);
    
    try {
      return await this.decrypt(encryptedData, key, iv);
    } catch (error) {
      throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}