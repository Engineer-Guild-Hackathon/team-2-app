export interface ChildPublic {
  grade: string;
  initial: string;
}

export interface InterestSummary {
  topic: string;
  score: number;
  confidence: 1 | 2 | 3;
}

export interface Artifact {
  id: string;
  type: 'photo' | 'text' | 'video' | 'audio';
  thumb_url?: string;
  caption: string;
  date: string;
  tags?: string[];
}

export type TokenStatus = 'active' | 'expired' | 'revoked' | 'exceeded';

export interface ShareResponse {
  child_public: ChildPublic;
  interest_summary: InterestSummary[];
  artifacts: Artifact[];
  token_status: TokenStatus;
}

export interface ShareError {
  error: string;
  code: number;
  message: string;
}