export type Role = 'parent' | 'child';

export interface Member {
  familyUid: string;
  memberId: string;
  role: Role;
  displayName: string;
  birthYear?: number;
  memberCode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  familyUid: string;
  taskId: string;
  assigneeMemberId: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;
  due?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Evidence {
  familyUid: string;
  evidenceId: string;
  taskId?: string;
  childMemberId: string;
  kind: 'photo' | 'voice' | 'note';
  blobRef?: string;
  text?: string;
  tags?: Array<'observe'|'compare'|'hypothesize'|'express'>;
  createdAt: number;
}

export interface Recommendation {
  familyUid: string;
  recommendId: string;
  targetMemberId: string;
  kind: 'question' | 'book' | 'place';
  title: string;
  reason: string;
  createdAt: number;
}