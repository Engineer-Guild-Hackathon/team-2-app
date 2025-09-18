import '@testing-library/jest-dom'

// Mock IndexedDB for testing
import 'fake-indexeddb/auto'

// Mock crypto for testing (Node.js doesn't have Web Crypto API by default)
// @ts-ignore
const { webcrypto } = require('crypto')

// Only set crypto if it's not already available
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    enumerable: true
  })
}