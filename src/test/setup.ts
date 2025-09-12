import '@testing-library/jest-dom'

// Mock IndexedDB for testing
import 'fake-indexeddb/auto'

// Mock crypto for testing (Node.js doesn't have Web Crypto API by default)
import { webcrypto } from 'crypto'

if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto
}