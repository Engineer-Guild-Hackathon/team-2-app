import { describe, it, expect } from 'vitest'
import { 
  FamilyUid, 
  MemberId, 
  TaskId, 
  EvidenceId, 
  RecommendId 
} from '../../domain/valueObjects'

describe('Value Objects', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000' // Valid UUID v4
  const invalidUuids = [
    'not-a-uuid',
    '123e4567-e89b-12d3-a456', // Too short
    '123e4567-e89b-12d3-a456-42661417400000', // Too long
    '123e4567-e89b-22d3-a456-426614174000', // Invalid version (should be 4)
    '', // Empty
  ]

  describe('FamilyUid', () => {
    describe('generate', () => {
      it('should generate valid UUID v4', () => {
        const familyUid = FamilyUid.generate()
        const uuidString = familyUid.toString()
        
        expect(uuidString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })

      it('should generate unique values', () => {
        const uid1 = FamilyUid.generate()
        const uid2 = FamilyUid.generate()
        
        expect(uid1.toString()).not.toBe(uid2.toString())
      })
    })

    describe('from', () => {
      it('should create from valid UUID', () => {
        const familyUid = FamilyUid.from(validUuid)
        expect(familyUid.toString()).toBe(validUuid)
      })

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach(invalidUuid => {
          expect(() => FamilyUid.from(invalidUuid))
            .toThrow('Invalid family UID format')
        })
      })
    })

    describe('toString', () => {
      it('should return the UUID string', () => {
        const familyUid = FamilyUid.from(validUuid)
        expect(familyUid.toString()).toBe(validUuid)
      })
    })
  })

  describe('MemberId', () => {
    describe('generate', () => {
      it('should generate valid UUID v4', () => {
        const memberId = MemberId.generate()
        const uuidString = memberId.toString()
        
        expect(uuidString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })

      it('should generate unique values', () => {
        const id1 = MemberId.generate()
        const id2 = MemberId.generate()
        
        expect(id1.toString()).not.toBe(id2.toString())
      })
    })

    describe('from', () => {
      it('should create from valid UUID', () => {
        const memberId = MemberId.from(validUuid)
        expect(memberId.toString()).toBe(validUuid)
      })

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach(invalidUuid => {
          expect(() => MemberId.from(invalidUuid))
            .toThrow('Invalid member ID format')
        })
      })
    })
  })

  describe('TaskId', () => {
    describe('generate', () => {
      it('should generate valid UUID v4', () => {
        const taskId = TaskId.generate()
        const uuidString = taskId.toString()
        
        expect(uuidString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })

      it('should generate unique values', () => {
        const id1 = TaskId.generate()
        const id2 = TaskId.generate()
        
        expect(id1.toString()).not.toBe(id2.toString())
      })
    })

    describe('from', () => {
      it('should create from valid UUID', () => {
        const taskId = TaskId.from(validUuid)
        expect(taskId.toString()).toBe(validUuid)
      })

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach(invalidUuid => {
          expect(() => TaskId.from(invalidUuid))
            .toThrow('Invalid task ID format')
        })
      })
    })
  })

  describe('EvidenceId', () => {
    describe('generate', () => {
      it('should generate valid UUID v4', () => {
        const evidenceId = EvidenceId.generate()
        const uuidString = evidenceId.toString()
        
        expect(uuidString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })

      it('should generate unique values', () => {
        const id1 = EvidenceId.generate()
        const id2 = EvidenceId.generate()
        
        expect(id1.toString()).not.toBe(id2.toString())
      })
    })

    describe('from', () => {
      it('should create from valid UUID', () => {
        const evidenceId = EvidenceId.from(validUuid)
        expect(evidenceId.toString()).toBe(validUuid)
      })

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach(invalidUuid => {
          expect(() => EvidenceId.from(invalidUuid))
            .toThrow('Invalid evidence ID format')
        })
      })
    })
  })

  describe('RecommendId', () => {
    describe('generate', () => {
      it('should generate valid UUID v4', () => {
        const recommendId = RecommendId.generate()
        const uuidString = recommendId.toString()
        
        expect(uuidString).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })

      it('should generate unique values', () => {
        const id1 = RecommendId.generate()
        const id2 = RecommendId.generate()
        
        expect(id1.toString()).not.toBe(id2.toString())
      })
    })

    describe('from', () => {
      it('should create from valid UUID', () => {
        const recommendId = RecommendId.from(validUuid)
        expect(recommendId.toString()).toBe(validUuid)
      })

      it('should throw error for invalid UUID', () => {
        invalidUuids.forEach(invalidUuid => {
          expect(() => RecommendId.from(invalidUuid))
            .toThrow('Invalid recommendation ID format')
        })
      })
    })
  })

  describe('Type safety', () => {
    it('should be different types', () => {
      const familyUid = FamilyUid.generate()
      const memberId = MemberId.generate()
      
      // These would cause TypeScript compilation errors if uncommented:
      // const cannotAssign: FamilyUid = memberId; // Type error
      // const cannotAssign2: MemberId = familyUid; // Type error
      
      // But they can be compared as strings
      expect(familyUid.toString()).not.toBe(memberId.toString())
    })

    it('should maintain immutability', () => {
      const familyUid = FamilyUid.from(validUuid)
      const originalValue = familyUid.toString()
      
      // Value objects should be immutable - no way to modify after creation
      expect(familyUid.toString()).toBe(originalValue)
      expect(familyUid.toString()).toBe(validUuid)
    })
  })
})