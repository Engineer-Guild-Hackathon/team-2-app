import { Member, Role } from './entities';

export class MemberCodeService {
  static generateMemberCode(): string {
    const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Removed I, O, L, 0, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  static isValidMemberCode(code: string): boolean {
    return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(code);
  }
}

export class MemberValidationService {
  static validateMember(member: Partial<Member>): string[] {
    const errors: string[] = [];

    if (!member.familyUid) {
      errors.push('Family UID is required');
    }

    if (!member.memberId) {
      errors.push('Member ID is required');
    }

    if (!member.displayName || member.displayName.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (!member.role || !['parent', 'child'].includes(member.role)) {
      errors.push('Valid role (parent or child) is required');
    }

    if (member.birthYear && (member.birthYear < 1900 || member.birthYear > new Date().getFullYear())) {
      errors.push('Birth year must be between 1900 and current year');
    }

    if (member.memberCode && !MemberCodeService.isValidMemberCode(member.memberCode)) {
      errors.push('Member code must be 6 characters long and contain only valid characters');
    }

    return errors;
  }
}

export class TaskValidationService {
  static validateTaskProgress(progress: number): boolean {
    return progress >= 0 && progress <= 100;
  }

  static isTaskOverdue(due?: string): boolean {
    if (!due) return false;
    const dueDate = new Date(due + 'T23:59:59'); // End of due date
    const today = new Date();
    return dueDate < today;
  }

  static canAddEvidence(status: string): boolean {
    return ['done', 'done_with_evidence'].includes(status);
  }
}