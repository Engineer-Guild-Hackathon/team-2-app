import { MemberRepository } from '../../../domain/repositories';
import { Member, Role } from '../../../domain/entities';
import { db } from '../dexieDB';

export class DexieMemberRepository implements MemberRepository {
  async findById(familyUid: string, memberId: string): Promise<Member | undefined> {
    return await db.members
      .where('[familyUid+memberId]')
      .equals([familyUid, memberId])
      .first();
  }

  async findByRole(familyUid: string, role: Role): Promise<Member[]> {
    return await db.members
      .where('[familyUid+role]')
      .equals([familyUid, role])
      .toArray();
  }

  async findAll(familyUid: string): Promise<Member[]> {
    return await db.members
      .where('familyUid')
      .equals(familyUid)
      .toArray();
  }

  async save(member: Member): Promise<void> {
    const existing = await this.findById(member.familyUid, member.memberId);
    
    if (existing) {
      await db.members
        .where('[familyUid+memberId]')
        .equals([member.familyUid, member.memberId])
        .modify({
          ...member,
          updatedAt: Date.now()
        });
    } else {
      await db.members.add({
        ...member,
        createdAt: member.createdAt || Date.now(),
        updatedAt: member.updatedAt || Date.now()
      });
    }
  }

  async delete(familyUid: string, memberId: string): Promise<void> {
    await db.members
      .where('[familyUid+memberId]')
      .equals([familyUid, memberId])
      .delete();
  }
}