import { BackupService, BackupData } from './backupService';
import { EncryptionService } from '../infrastructure/crypto/encryptionService';

export interface EncryptedBackup {
  encryptedData: string;
  salt: string;
  iv: string;
  version: string;
  exportedAt: number;
  familyUid: string;
}

export class SecureBackupService {
  private encryptionService = new EncryptionService();

  constructor(private readonly backupService: BackupService) {}

  /**
   * Create an encrypted backup of family data
   */
  async createEncryptedBackup(familyUid: string, password: string): Promise<EncryptedBackup> {
    // Validate password strength
    const passwordValidation = this.encryptionService.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Get backup data
    const backupData = await this.backupService.exportData(familyUid);
    const jsonData = JSON.stringify(backupData);

    // Encrypt the data
    const encryptedPackage = await this.encryptionService.createEncryptedBackup(jsonData, password);

    return {
      ...encryptedPackage,
      exportedAt: Date.now(),
      familyUid
    };
  }

  /**
   * Create an encrypted backup and return as JSON string
   */
  async createEncryptedBackupJSON(familyUid: string, password: string): Promise<string> {
    const encryptedBackup = await this.createEncryptedBackup(familyUid, password);
    return JSON.stringify(encryptedBackup, null, 2);
  }

  /**
   * Restore data from an encrypted backup
   */
  async restoreFromEncryptedBackup(encryptedBackup: EncryptedBackup, password: string): Promise<void> {
    // Decrypt the data
    const decryptedData = await this.encryptionService.decryptBackup(encryptedBackup, password);
    
    // Parse the backup data
    let backupData: BackupData;
    try {
      backupData = JSON.parse(decryptedData);
    } catch (error) {
      throw new Error('Invalid backup data format after decryption');
    }

    // Verify family UID consistency
    if (backupData.familyUid !== encryptedBackup.familyUid) {
      throw new Error('Family UID mismatch between encrypted backup and decrypted data');
    }

    // Import the data using the backup service
    await this.backupService.importData(backupData);
  }

  /**
   * Restore data from encrypted backup JSON string
   */
  async restoreFromEncryptedBackupJSON(jsonString: string, password: string): Promise<void> {
    let encryptedBackup: EncryptedBackup;
    
    try {
      encryptedBackup = JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid encrypted backup JSON format');
    }

    // Validate required fields
    if (!encryptedBackup.encryptedData || !encryptedBackup.salt || !encryptedBackup.iv || 
        !encryptedBackup.version || !encryptedBackup.familyUid) {
      throw new Error('Invalid encrypted backup structure');
    }

    await this.restoreFromEncryptedBackup(encryptedBackup, password);
  }

  /**
   * Verify that an encrypted backup can be decrypted with the given password
   */
  async verifyBackupPassword(encryptedBackup: EncryptedBackup, password: string): Promise<boolean> {
    try {
      await this.encryptionService.decryptBackup(encryptedBackup, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change the password of an encrypted backup
   */
  async changeBackupPassword(
    encryptedBackup: EncryptedBackup, 
    oldPassword: string, 
    newPassword: string
  ): Promise<EncryptedBackup> {
    // Validate new password strength
    const passwordValidation = this.encryptionService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Decrypt with old password
    const decryptedData = await this.encryptionService.decryptBackup(encryptedBackup, oldPassword);
    
    // Encrypt with new password
    const newEncryptedPackage = await this.encryptionService.createEncryptedBackup(decryptedData, newPassword);

    return {
      ...newEncryptedPackage,
      exportedAt: Date.now(),
      familyUid: encryptedBackup.familyUid
    };
  }

  /**
   * Get metadata from encrypted backup without decrypting the data
   */
  getBackupMetadata(encryptedBackup: EncryptedBackup): {
    familyUid: string;
    exportedAt: number;
    version: string;
    estimatedSize: number;
  } {
    const jsonString = JSON.stringify(encryptedBackup);
    
    return {
      familyUid: encryptedBackup.familyUid,
      exportedAt: encryptedBackup.exportedAt,
      version: encryptedBackup.version,
      estimatedSize: new Blob([jsonString]).size
    };
  }

  /**
   * Validate encrypted backup integrity (structure only, not content)
   */
  validateEncryptedBackup(encryptedBackup: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!encryptedBackup.encryptedData) {
      errors.push('Missing encrypted data');
    }

    if (!encryptedBackup.salt) {
      errors.push('Missing salt');
    }

    if (!encryptedBackup.iv) {
      errors.push('Missing initialization vector');
    }

    if (!encryptedBackup.version) {
      errors.push('Missing version');
    } else if (encryptedBackup.version !== '1.0') {
      errors.push(`Unsupported version: ${encryptedBackup.version}`);
    }

    if (!encryptedBackup.familyUid) {
      errors.push('Missing family UID');
    }

    if (!encryptedBackup.exportedAt || typeof encryptedBackup.exportedAt !== 'number') {
      errors.push('Missing or invalid export timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}