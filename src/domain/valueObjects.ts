import { v4 as uuidv4 } from 'uuid';

export class FamilyUid {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid family UID format');
    }
  }

  static generate(): FamilyUid {
    return new FamilyUid(uuidv4());
  }

  static from(value: string): FamilyUid {
    return new FamilyUid(value);
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

export class MemberId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid member ID format');
    }
  }

  static generate(): MemberId {
    return new MemberId(uuidv4());
  }

  static from(value: string): MemberId {
    return new MemberId(value);
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

export class TaskId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid task ID format');
    }
  }

  static generate(): TaskId {
    return new TaskId(uuidv4());
  }

  static from(value: string): TaskId {
    return new TaskId(value);
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

export class EvidenceId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid evidence ID format');
    }
  }

  static generate(): EvidenceId {
    return new EvidenceId(uuidv4());
  }

  static from(value: string): EvidenceId {
    return new EvidenceId(value);
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

export class RecommendId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid recommendation ID format');
    }
  }

  static generate(): RecommendId {
    return new RecommendId(uuidv4());
  }

  static from(value: string): RecommendId {
    return new RecommendId(value);
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}