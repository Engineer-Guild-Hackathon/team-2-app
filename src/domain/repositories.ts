import { Member, Task, Evidence, Recommendation, Role } from './entities';

export interface MemberRepository {
  findById(familyUid: string, memberId: string): Promise<Member | undefined>;
  findByRole(familyUid: string, role: Role): Promise<Member[]>;
  findAll(familyUid: string): Promise<Member[]>;
  save(member: Member): Promise<void>;
  delete(familyUid: string, memberId: string): Promise<void>;
}

export interface TaskRepository {
  findById(familyUid: string, taskId: string): Promise<Task | undefined>;
  findByAssignee(familyUid: string, assigneeMemberId: string): Promise<Task[]>;
  findByStatus(familyUid: string, status: Task['status']): Promise<Task[]>;
  findAll(familyUid: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(familyUid: string, taskId: string): Promise<void>;
}

export interface EvidenceRepository {
  findById(familyUid: string, evidenceId: string): Promise<Evidence | undefined>;
  findByChild(familyUid: string, childMemberId: string): Promise<Evidence[]>;
  findByTask(familyUid: string, taskId: string): Promise<Evidence[]>;
  findAll(familyUid: string): Promise<Evidence[]>;
  save(evidence: Evidence): Promise<void>;
  delete(familyUid: string, evidenceId: string): Promise<void>;
}

export interface RecommendationRepository {
  findById(familyUid: string, recommendId: string): Promise<Recommendation | undefined>;
  findByTarget(familyUid: string, targetMemberId: string): Promise<Recommendation[]>;
  findByKind(familyUid: string, kind: Recommendation['kind']): Promise<Recommendation[]>;
  findAll(familyUid: string): Promise<Recommendation[]>;
  save(recommendation: Recommendation): Promise<void>;
  delete(familyUid: string, recommendId: string): Promise<void>;
}

export interface BackupRepository {
  export(familyUid: string): Promise<{
    members: Member[];
    tasks: Task[];
    evidence: Evidence[];
    recommendations: Recommendation[];
  }>;
  import(familyUid: string, data: {
    members: Member[];
    tasks: Task[];
    evidence: Evidence[];
    recommendations: Recommendation[];
  }): Promise<void>;
  clear(familyUid: string): Promise<void>;
}