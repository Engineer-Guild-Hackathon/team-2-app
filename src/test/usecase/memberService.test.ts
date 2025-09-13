import { describe, it, expect, beforeEach } from 'vitest'
import { MemberService } from '../../usecase/memberService'
import { DexieMemberRepository } from '../../infrastructure/db/repositories/memberRepository'
import { Member } from '../../domain/entities'
import { db } from '../../infrastructure/db/dexieDB'

describe('MemberService', () => {
  let memberService: MemberService
  let memberRepository: DexieMemberRepository
  const familyUid = 'test-family-uid'

  beforeEach(async () => {
    memberRepository = new DexieMemberRepository()
    memberService = new MemberService(memberRepository)
    
    // Clear test data
    await db.clearFamilyData(familyUid)
  })

  describe('createMember', () => {
    it('should create a parent member successfully', async () => {
      const params = {
        familyUid,
        role: 'parent' as const,
        displayName: 'テスト親',
        birthYear: 1980
      }

      const member = await memberService.createMember(params)

      expect(member.familyUid).toBe(familyUid)
      expect(member.role).toBe('parent')
      expect(member.displayName).toBe('テスト親')
      expect(member.birthYear).toBe(1980)
      expect(member.memberId).toBeDefined()
      expect(member.memberCode).toBeDefined()
      expect(member.createdAt).toBeDefined()
      expect(member.updatedAt).toBeDefined()
    })

    it('should create a child member successfully', async () => {
      const params = {
        familyUid,
        role: 'child' as const,
        displayName: 'テスト子ども',
        birthYear: 2015
      }

      const member = await memberService.createMember(params)

      expect(member.familyUid).toBe(familyUid)
      expect(member.role).toBe('child')
      expect(member.displayName).toBe('テスト子ども')
      expect(member.birthYear).toBe(2015)
    })

    it('should throw error for invalid display name', async () => {
      const params = {
        familyUid,
        role: 'parent' as const,
        displayName: '',
      }

      await expect(memberService.createMember(params))
        .rejects.toThrow('Member validation failed')
    })

    it('should trim display name', async () => {
      const params = {
        familyUid,
        role: 'parent' as const,
        displayName: '  テスト親  ',
      }

      const member = await memberService.createMember(params)
      expect(member.displayName).toBe('テスト親')
    })
  })

  describe('updateMember', () => {
    let existingMember: Member

    beforeEach(async () => {
      existingMember = await memberService.createMember({
        familyUid,
        role: 'parent',
        displayName: 'テスト親',
      })
    })

    it('should update member successfully', async () => {
      const updates = {
        displayName: '更新された親',
        birthYear: 1985
      }

      const updatedMember = await memberService.updateMember(
        familyUid,
        existingMember.memberId,
        updates
      )

      expect(updatedMember.displayName).toBe('更新された親')
      expect(updatedMember.birthYear).toBe(1985)
      expect(updatedMember.updatedAt).toBeGreaterThan(existingMember.updatedAt)
    })

    it('should throw error for non-existent member', async () => {
      await expect(memberService.updateMember(familyUid, 'non-existent', {}))
        .rejects.toThrow('Member not found')
    })
  })

  describe('getMember', () => {
    it('should return member if exists', async () => {
      const createdMember = await memberService.createMember({
        familyUid,
        role: 'parent',
        displayName: 'テスト親',
      })

      const member = await memberService.getMember(familyUid, createdMember.memberId)
      expect(member).toBeDefined()
      expect(member?.memberId).toBe(createdMember.memberId)
    })

    it('should return undefined for non-existent member', async () => {
      const member = await memberService.getMember(familyUid, 'non-existent')
      expect(member).toBeUndefined()
    })
  })

  describe('listChildren and listParents', () => {
    beforeEach(async () => {
      await memberService.createMember({
        familyUid,
        role: 'parent',
        displayName: '親1',
      })
      await memberService.createMember({
        familyUid,
        role: 'parent',
        displayName: '親2',
      })
      await memberService.createMember({
        familyUid,
        role: 'child',
        displayName: '子ども1',
      })
      await memberService.createMember({
        familyUid,
        role: 'child',
        displayName: '子ども2',
      })
    })

    it('should list only children', async () => {
      const children = await memberService.listChildren(familyUid)
      expect(children).toHaveLength(2)
      children.forEach(child => expect(child.role).toBe('child'))
    })

    it('should list only parents', async () => {
      const parents = await memberService.listParents(familyUid)
      expect(parents).toHaveLength(2)
      parents.forEach(parent => expect(parent.role).toBe('parent'))
    })
  })

  describe('findByMemberCode', () => {
    it('should find member by member code', async () => {
      const createdMember = await memberService.createMember({
        familyUid,
        role: 'child',
        displayName: 'テスト子ども',
      })

      const foundMember = await memberService.findByMemberCode(
        familyUid, 
        createdMember.memberCode!
      )

      expect(foundMember).toBeDefined()
      expect(foundMember?.memberId).toBe(createdMember.memberId)
    })

    it('should return undefined for non-existent member code', async () => {
      const foundMember = await memberService.findByMemberCode(familyUid, 'INVALID')
      expect(foundMember).toBeUndefined()
    })
  })

  describe('deleteMember', () => {
    it('should delete member successfully', async () => {
      const createdMember = await memberService.createMember({
        familyUid,
        role: 'parent',
        displayName: 'テスト親',
      })

      await memberService.deleteMember(familyUid, createdMember.memberId)

      const member = await memberService.getMember(familyUid, createdMember.memberId)
      expect(member).toBeUndefined()
    })

    it('should throw error for non-existent member', async () => {
      await expect(memberService.deleteMember(familyUid, 'non-existent'))
        .rejects.toThrow('Member not found')
    })
  })
})