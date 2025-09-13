import { describe, it, expect, beforeEach } from 'vitest'
import { BackupService } from '../../usecase/backupService'
import { MemberService } from '../../usecase/memberService'
import { TaskService } from '../../usecase/taskService'
import { DexieBackupRepository } from '../../infrastructure/db/repositories/backupRepository'
import { DexieMemberRepository } from '../../infrastructure/db/repositories/memberRepository'
import { DexieTaskRepository } from '../../infrastructure/db/repositories/taskRepository'
import { Member, Task } from '../../domain/entities'
import { db } from '../../infrastructure/db/dexieDB'

describe('BackupService', () => {
  let backupService: BackupService
  let memberService: MemberService
  let taskService: TaskService
  const familyUid = 'test-family-uid'
  let testMember: Member

  beforeEach(async () => {
    const backupRepository = new DexieBackupRepository()
    const memberRepository = new DexieMemberRepository()
    const taskRepository = new DexieTaskRepository()
    
    backupService = new BackupService(backupRepository)
    memberService = new MemberService(memberRepository)
    taskService = new TaskService(taskRepository, memberRepository)
    
    // Clear test data
    await db.clearFamilyData(familyUid)
    
    // Create test data
    testMember = await memberService.createMember({
      familyUid,
      role: 'child',
      displayName: 'テスト子ども',
      birthYear: 2010
    })
  })

  describe('exportData', () => {
    it('should export family data correctly', async () => {
      // Create some test data
      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'テストタスク',
        type: 'homework',
      })

      const backupData = await backupService.exportData(familyUid)

      expect(backupData.version).toBe('1.0')
      expect(backupData.familyUid).toBe(familyUid)
      expect(backupData.exportedAt).toBeDefined()
      expect(backupData.data.members).toHaveLength(1)
      expect(backupData.data.tasks).toHaveLength(1)
      expect(backupData.data.evidence).toHaveLength(0)
      expect(backupData.data.recommendations).toHaveLength(0)
    })

    it('should export as JSON string', async () => {
      const jsonString = await backupService.exportDataAsJSON(familyUid)
      
      expect(typeof jsonString).toBe('string')
      const parsed = JSON.parse(jsonString)
      expect(parsed.familyUid).toBe(familyUid)
      expect(parsed.version).toBe('1.0')
    })
  })

  describe('importData', () => {
    it('should import data correctly', async () => {
      // Create and export data
      const originalData = await backupService.exportData(familyUid)
      
      // Clear data
      await backupService.clearAllData(familyUid)
      
      // Verify data is cleared
      const clearedData = await backupService.exportData(familyUid)
      expect(clearedData.data.members).toHaveLength(0)
      
      // Import data back
      await backupService.importData(originalData)
      
      // Verify data is restored
      const restoredData = await backupService.exportData(familyUid)
      expect(restoredData.data.members).toHaveLength(1)
      expect(restoredData.data.members[0].displayName).toBe('テスト子ども')
    })

    it('should import from JSON string', async () => {
      const jsonString = await backupService.exportDataAsJSON(familyUid)
      
      // Clear data
      await backupService.clearAllData(familyUid)
      
      // Import from JSON
      await backupService.importFromJSON(jsonString)
      
      // Verify data is restored
      const members = await memberService.listAllMembers(familyUid)
      expect(members).toHaveLength(1)
    })

    it('should throw error for invalid backup format', async () => {
      const invalidBackup = {
        version: '1.0',
        familyUid,
        // missing data field
      }

      await expect(backupService.importData(invalidBackup as any))
        .rejects.toThrow('Invalid backup format')
    })

    it('should throw error for unsupported version', async () => {
      const invalidVersionBackup = {
        version: '2.0',
        exportedAt: Date.now(),
        familyUid,
        data: {
          members: [],
          tasks: [],
          evidence: [],
          recommendations: []
        }
      }

      await expect(backupService.importData(invalidVersionBackup))
        .rejects.toThrow('Unsupported backup version: 2.0')
    })

    it('should throw error for invalid JSON', async () => {
      const invalidJson = '{ invalid json }'

      await expect(backupService.importFromJSON(invalidJson))
        .rejects.toThrow('Invalid JSON format')
    })

    it('should throw error for inconsistent family UID', async () => {
      const backupData = await backupService.exportData(familyUid)
      
      // Modify member's familyUid to create inconsistency
      backupData.data.members[0].familyUid = 'different-family-uid'

      await expect(backupService.importData(backupData))
        .rejects.toThrow('Backup contains data with inconsistent family UID')
    })
  })

  describe('validateAndImportData', () => {
    it('should validate and import valid data', async () => {
      const backupData = await backupService.exportData(familyUid)
      
      // Clear data
      await backupService.clearAllData(familyUid)
      
      const result = await backupService.validateAndImportData(backupData)
      
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      
      // Verify data is imported
      const members = await memberService.listAllMembers(familyUid)
      expect(members).toHaveLength(1)
    })

    it('should return errors for invalid data', async () => {
      const invalidBackup = {
        version: '1.0',
        exportedAt: Date.now(),
        familyUid,
        data: {
          members: [{
            familyUid,
            memberId: '',  // Invalid: empty memberId
            role: 'child' as const,
            displayName: '',  // Invalid: empty displayName
            createdAt: Date.now(),
            updatedAt: Date.now()
          }],
          tasks: [],
          evidence: [],
          recommendations: []
        }
      }

      const result = await backupService.validateAndImportData(invalidBackup)
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('getBackupStats', () => {
    it('should return correct backup statistics', async () => {
      // Create additional test data
      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'タスク1',
        type: 'homework',
      })
      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'タスク2',
        type: 'test',
      })

      const stats = await backupService.getBackupStats(familyUid)

      expect(stats.memberCount).toBe(1)
      expect(stats.taskCount).toBe(2)
      expect(stats.evidenceCount).toBe(0)
      expect(stats.recommendationCount).toBe(0)
      expect(stats.totalItems).toBe(3)
      expect(stats.estimatedSize).toBeGreaterThan(0)
    })
  })

  describe('clearAllData', () => {
    it('should clear all family data', async () => {
      // Verify data exists
      const beforeStats = await backupService.getBackupStats(familyUid)
      expect(beforeStats.totalItems).toBeGreaterThan(0)

      // Clear data
      await backupService.clearAllData(familyUid)

      // Verify data is cleared
      const afterStats = await backupService.getBackupStats(familyUid)
      expect(afterStats.totalItems).toBe(0)
    })
  })
})