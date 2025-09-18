import { Member, Role } from '../domain/entities';
import { MemberRepository } from '../domain/repositories';
import { MemberId, FamilyUid, MemberCodeService, MemberValidationService } from '../domain';

export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  async createMember(params: {
    familyUid: string;
    role: Role;
    displayName: string;
    birthYear?: number;
  }): Promise<Member> {
    const memberId = MemberId.generate().toString();
    const memberCode = MemberCodeService.generateMemberCode();
    
    const member: Member = {
      familyUid: params.familyUid,
      memberId,
      role: params.role,
      displayName: params.displayName.trim(),
      birthYear: params.birthYear,
      memberCode,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Validate the member
    const validationErrors = MemberValidationService.validateMember(member);
    if (validationErrors.length > 0) {
      throw new Error(`Member validation failed: ${validationErrors.join(', ')}`);
    }

    await this.memberRepository.save(member);
    return member;
  }

  async updateMember(
    familyUid: string, 
    memberId: string, 
    updates: Partial<Pick<Member, 'displayName' | 'birthYear'>>
  ): Promise<Member> {
    const existingMember = await this.memberRepository.findById(familyUid, memberId);
    if (!existingMember) {
      throw new Error('Member not found');
    }

    const updatedMember: Member = {
      ...existingMember,
      ...updates,
      displayName: updates.displayName ? updates.displayName.trim() : existingMember.displayName,
      updatedAt: Date.now()
    };

    // Validate the updated member
    const validationErrors = MemberValidationService.validateMember(updatedMember);
    if (validationErrors.length > 0) {
      throw new Error(`Member validation failed: ${validationErrors.join(', ')}`);
    }

    await this.memberRepository.save(updatedMember);
    return updatedMember;
  }

  async getMember(familyUid: string, memberId: string): Promise<Member | undefined> {
    return await this.memberRepository.findById(familyUid, memberId);
  }

  async listChildren(familyUid: string): Promise<Member[]> {
    return await this.memberRepository.findByRole(familyUid, 'child');
  }

  async listParents(familyUid: string): Promise<Member[]> {
    return await this.memberRepository.findByRole(familyUid, 'parent');
  }

  async listAllMembers(familyUid: string): Promise<Member[]> {
    return await this.memberRepository.findAll(familyUid);
  }

  async deleteMember(familyUid: string, memberId: string): Promise<void> {
    const member = await this.memberRepository.findById(familyUid, memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    await this.memberRepository.delete(familyUid, memberId);
  }

  async findByMemberCode(familyUid: string, memberCode: string): Promise<Member | undefined> {
    const allMembers = await this.memberRepository.findAll(familyUid);
    return allMembers.find(member => member.memberCode === memberCode);
  }

  async generateNewMemberCode(familyUid: string, memberId: string): Promise<string> {
    const member = await this.memberRepository.findById(familyUid, memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const newMemberCode = MemberCodeService.generateMemberCode();
    const updatedMember = {
      ...member,
      memberCode: newMemberCode,
      updatedAt: Date.now()
    };

    await this.memberRepository.save(updatedMember);
    return newMemberCode;
  }
}