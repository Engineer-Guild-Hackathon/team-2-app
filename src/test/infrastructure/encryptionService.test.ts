import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionService } from '../../infrastructure/crypto/encryptionService'

// Skip crypto tests in Node.js environment for now
describe.skip('EncryptionService', () => {
  let encryptionService: EncryptionService

  beforeEach(() => {
    encryptionService = new EncryptionService()
  })

  describe('key generation and management', () => {
    it('should generate a cryptographic key', async () => {
      const key = await encryptionService.generateKey()
      expect(key).toBeInstanceOf(CryptoKey)
      expect(key.type).toBe('secret')
      expect(key.algorithm.name).toBe('AES-GCM')
    })

    it('should derive key from password with salt', async () => {
      const password = 'TestPassword123!'
      const salt = encryptionService.generateSalt()
      
      const key = await encryptionService.deriveKeyFromPassword(password, salt)
      expect(key).toBeInstanceOf(CryptoKey)
      expect(key.algorithm.name).toBe('AES-GCM')
    })

    it('should generate random salt', () => {
      const salt1 = encryptionService.generateSalt()
      const salt2 = encryptionService.generateSalt()
      
      expect(salt1).toBeInstanceOf(Uint8Array)
      expect(salt1.length).toBe(16)
      expect(salt2).toBeInstanceOf(Uint8Array)
      expect(salt2.length).toBe(16)
      expect(salt1).not.toEqual(salt2) // Should be random
    })

    it('should generate random IV', () => {
      const iv1 = encryptionService.generateIV()
      const iv2 = encryptionService.generateIV()
      
      expect(iv1).toBeInstanceOf(Uint8Array)
      expect(iv1.length).toBe(12)
      expect(iv2).toBeInstanceOf(Uint8Array)
      expect(iv2.length).toBe(12)
      expect(iv1).not.toEqual(iv2) // Should be random
    })

    it('should export and import key', async () => {
      const originalKey = await encryptionService.generateKey()
      
      const exportedKey = await encryptionService.exportKey(originalKey)
      expect(exportedKey).toBeInstanceOf(ArrayBuffer)
      
      const importedKey = await encryptionService.importKey(exportedKey)
      expect(importedKey).toBeInstanceOf(CryptoKey)
      expect(importedKey.algorithm.name).toBe('AES-GCM')
    })
  })

  describe('encryption and decryption', () => {
    it('should encrypt and decrypt data', async () => {
      const plaintext = 'Hello, World! これはテストデータです。'
      const key = await encryptionService.generateKey()

      const { encryptedData, iv } = await encryptionService.encrypt(plaintext, key)
      expect(encryptedData).toBeInstanceOf(ArrayBuffer)
      expect(iv).toBeInstanceOf(Uint8Array)

      const decryptedData = await encryptionService.decrypt(encryptedData, key, iv)
      expect(decryptedData).toBe(plaintext)
    })

    it('should fail to decrypt with wrong key', async () => {
      const plaintext = 'Secret data'
      const key1 = await encryptionService.generateKey()
      const key2 = await encryptionService.generateKey()

      const { encryptedData, iv } = await encryptionService.encrypt(plaintext, key1)
      
      await expect(encryptionService.decrypt(encryptedData, key2, iv))
        .rejects.toThrow()
    })

    it('should fail to decrypt with wrong IV', async () => {
      const plaintext = 'Secret data'
      const key = await encryptionService.generateKey()

      const { encryptedData } = await encryptionService.encrypt(plaintext, key)
      const wrongIV = encryptionService.generateIV()
      
      await expect(encryptionService.decrypt(encryptedData, key, wrongIV))
        .rejects.toThrow()
    })
  })

  describe('Base64 conversion', () => {
    it('should convert ArrayBuffer to Base64 and back', () => {
      const original = new TextEncoder().encode('Test data テストデータ')
      
      const base64 = encryptionService.arrayBufferToBase64(original.buffer)
      expect(typeof base64).toBe('string')
      expect(base64.length).toBeGreaterThan(0)
      
      const restored = encryptionService.base64ToArrayBuffer(base64)
      expect(new Uint8Array(restored)).toEqual(original)
    })
  })

  describe('encrypted backup package', () => {
    it('should create and decrypt encrypted backup', async () => {
      const originalData = JSON.stringify({
        message: 'This is test data',
        number: 42,
        japanese: 'これはテストです'
      })
      const password = 'StrongPassword123!'

      const encryptedPackage = await encryptionService.createEncryptedBackup(
        originalData, 
        password
      )

      expect(encryptedPackage.version).toBe('1.0')
      expect(encryptedPackage.encryptedData).toBeDefined()
      expect(encryptedPackage.salt).toBeDefined()
      expect(encryptedPackage.iv).toBeDefined()

      const decryptedData = await encryptionService.decryptBackup(
        encryptedPackage, 
        password
      )
      
      expect(decryptedData).toBe(originalData)
    })

    it('should fail to decrypt with wrong password', async () => {
      const originalData = 'Secret information'
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword123!'

      const encryptedPackage = await encryptionService.createEncryptedBackup(
        originalData, 
        password
      )

      await expect(encryptionService.decryptBackup(encryptedPackage, wrongPassword))
        .rejects.toThrow('Decryption failed. Invalid password or corrupted data.')
    })

    it('should fail to decrypt unsupported version', async () => {
      const encryptedPackage = {
        version: '2.0',
        encryptedData: 'data',
        salt: 'salt',
        iv: 'iv'
      }

      await expect(encryptionService.decryptBackup(encryptedPackage, 'password'))
        .rejects.toThrow('Unsupported encryption version: 2.0')
    })
  })

  describe('password validation', () => {
    it('should accept strong password', () => {
      const strongPassword = 'StrongPassword123!'
      const result = encryptionService.validatePassword(strongPassword)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      const testCases = [
        { password: 'short', expectedErrors: ['at least 8 characters', 'uppercase', 'number', 'special'] },
        { password: 'nouppercase123!', expectedErrors: ['uppercase'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['lowercase'] },
        { password: 'NoNumbers!', expectedErrors: ['number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['special'] }
      ]

      testCases.forEach(({ password, expectedErrors }) => {
        const result = encryptionService.validatePassword(password)
        expect(result.isValid).toBe(false)
        
        expectedErrors.forEach(errorKeyword => {
          const hasExpectedError = result.errors.some(error => 
            error.toLowerCase().includes(errorKeyword)
          )
          expect(hasExpectedError).toBe(true)
        })
      })
    })
  })

  describe('large data encryption', () => {
    it('should handle large data encryption', async () => {
      // Create large JSON data
      const largeData = JSON.stringify({
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          data: `This is some sample data for user ${i}`.repeat(10)
        }))
      })

      const password = 'StrongPassword123!'
      
      const encryptedPackage = await encryptionService.createEncryptedBackup(
        largeData,
        password
      )
      
      const decryptedData = await encryptionService.decryptBackup(
        encryptedPackage,
        password
      )
      
      expect(decryptedData).toBe(largeData)
      
      // Verify it's actually a large amount of data
      expect(largeData.length).toBeGreaterThan(100000)
    })
  })
})