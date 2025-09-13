import { describe, it, expect } from 'vitest'
import { 
  MemberCodeService, 
  MemberValidationService, 
  TaskValidationService 
} from '../../domain/services'
import { Member } from '../../domain/entities'

describe('Domain Services', () => {
  describe('MemberCodeService', () => {
    describe('generateMemberCode', () => {
      it('should generate valid member code', () => {
        const code = MemberCodeService.generateMemberCode()
        
        expect(code).toHaveLength(6)
        expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
      })

      it('should generate different codes', () => {
        const code1 = MemberCodeService.generateMemberCode()
        const code2 = MemberCodeService.generateMemberCode()
        
        expect(code1).not.toBe(code2)
      })

      it('should not contain confusing characters', () => {
        // Generate multiple codes to test
        const codes = Array.from({ length: 100 }, () => MemberCodeService.generateMemberCode())
        
        codes.forEach(code => {
          expect(code).not.toMatch(/[01OIL]/) // Should not contain 0, 1, O, I, L
        })
      })
    })

    describe('isValidMemberCode', () => {
      it('should validate correct member codes', () => {
        const validCodes = ['ABC234', 'XYZ789', 'H3J4K5'] // Removed codes with invalid characters
        
        validCodes.forEach(code => {
          expect(MemberCodeService.isValidMemberCode(code)).toBe(true)
        })
      })

      it('should reject invalid member codes', () => {
        const invalidCodes = [
          'ABC12',     // Too short
          'ABC1234',   // Too long
          'abc123',    // Lowercase
          'ABC0123',   // Contains 0
          'ABC1I23',   // Contains I
          'ABCO123',   // Contains O
          'ABC L23',   // Contains space
          'ABC-123',   // Contains dash
          '',          // Empty
        ]
        
        invalidCodes.forEach(code => {
          expect(MemberCodeService.isValidMemberCode(code)).toBe(false)
        })
      })
    })
  })

  describe('MemberValidationService', () => {
    describe('validateMember', () => {
      it('should pass validation for valid member', () => {
        const validMember: Member = {
          familyUid: 'family-123',
          memberId: 'member-456',
          role: 'child',
          displayName: 'テスト子ども',
          birthYear: 2010,
          memberCode: 'ABC234', // Valid member code
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        const errors = MemberValidationService.validateMember(validMember)
        expect(errors).toHaveLength(0)
      })

      it('should detect missing required fields', () => {
        const invalidMember: Partial<Member> = {
          // Missing familyUid, memberId, displayName, role
          birthYear: 2010,
        }

        const errors = MemberValidationService.validateMember(invalidMember)
        
        expect(errors).toContain('Family UID is required')
        expect(errors).toContain('Member ID is required')
        expect(errors).toContain('Display name is required')
        expect(errors).toContain('Valid role (parent or child) is required')
      })

      it('should detect invalid role', () => {
        const invalidMember: Partial<Member> = {
          familyUid: 'family-123',
          memberId: 'member-456',
          displayName: 'テスト',
          role: 'invalid' as any,
        }

        const errors = MemberValidationService.validateMember(invalidMember)
        expect(errors).toContain('Valid role (parent or child) is required')
      })

      it('should detect empty display name', () => {
        const invalidMember: Partial<Member> = {
          familyUid: 'family-123',
          memberId: 'member-456',
          displayName: '   ', // Only whitespace
          role: 'child',
        }

        const errors = MemberValidationService.validateMember(invalidMember)
        expect(errors).toContain('Display name is required')
      })

      it('should detect invalid birth year', () => {
        const testCases = [
          { birthYear: 1899, description: 'too old' },
          { birthYear: new Date().getFullYear() + 1, description: 'future year' },
        ]

        testCases.forEach(({ birthYear, description }) => {
          const invalidMember: Partial<Member> = {
            familyUid: 'family-123',
            memberId: 'member-456',
            displayName: 'テスト',
            role: 'child',
            birthYear,
          }

          const errors = MemberValidationService.validateMember(invalidMember)
          expect(errors.some(error => error.includes('Birth year'))).toBe(true)
        })
      })

      it('should detect invalid member code', () => {
        const invalidMember: Partial<Member> = {
          familyUid: 'family-123',
          memberId: 'member-456',
          displayName: 'テスト',
          role: 'child',
          memberCode: 'INVALID', // Wrong format
        }

        const errors = MemberValidationService.validateMember(invalidMember)
        expect(errors).toContain('Member code must be 6 characters long and contain only valid characters')
      })

      it('should accept valid birth years', () => {
        const currentYear = new Date().getFullYear()
        const validYears = [1900, 1980, 2000, 2010, currentYear]

        validYears.forEach(birthYear => {
          const validMember: Partial<Member> = {
            familyUid: 'family-123',
            memberId: 'member-456',
            displayName: 'テスト',
            role: 'child',
            birthYear,
          }

          const errors = MemberValidationService.validateMember(validMember)
          expect(errors.some(error => error.includes('Birth year'))).toBe(false)
        })
      })
    })
  })

  describe('TaskValidationService', () => {
    describe('validateTaskProgress', () => {
      it('should validate correct progress values', () => {
        const validProgressValues = [0, 25, 50, 75, 100]
        
        validProgressValues.forEach(progress => {
          expect(TaskValidationService.validateTaskProgress(progress)).toBe(true)
        })
      })

      it('should reject invalid progress values', () => {
        const invalidProgressValues = [-1, -10, 101, 150, 999]
        
        invalidProgressValues.forEach(progress => {
          expect(TaskValidationService.validateTaskProgress(progress)).toBe(false)
        })
      })

      it('should handle decimal values', () => {
        expect(TaskValidationService.validateTaskProgress(50.5)).toBe(true)
        expect(TaskValidationService.validateTaskProgress(99.9)).toBe(true)
        expect(TaskValidationService.validateTaskProgress(0.1)).toBe(true)
      })
    })

    describe('isTaskOverdue', () => {
      it('should detect overdue tasks', () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const overdueDate = yesterday.toISOString().split('T')[0]
        
        expect(TaskValidationService.isTaskOverdue(overdueDate)).toBe(true)
      })

      it('should not mark future tasks as overdue', () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const futureDate = tomorrow.toISOString().split('T')[0]
        
        expect(TaskValidationService.isTaskOverdue(futureDate)).toBe(false)
      })

      it('should handle today as not overdue', () => {
        const today = new Date()
        const todayString = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0')
        
        expect(TaskValidationService.isTaskOverdue(todayString)).toBe(false)
      })

      it('should handle undefined due date', () => {
        expect(TaskValidationService.isTaskOverdue(undefined)).toBe(false)
      })

      it('should handle empty due date', () => {
        expect(TaskValidationService.isTaskOverdue('')).toBe(false)
      })
    })

    describe('canAddEvidence', () => {
      it('should allow evidence for completed statuses', () => {
        expect(TaskValidationService.canAddEvidence('done')).toBe(true)
        expect(TaskValidationService.canAddEvidence('done_with_evidence')).toBe(true)
      })

      it('should not allow evidence for incomplete statuses', () => {
        expect(TaskValidationService.canAddEvidence('todo')).toBe(false)
        expect(TaskValidationService.canAddEvidence('doing')).toBe(false)
      })
    })
  })
})