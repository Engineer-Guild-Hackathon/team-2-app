# specs/05_SCHEMAS.md (データスキーマ定義)

> バージョン: v0.2 (2025-09-18 JST)
> Firestore & APIデータスキーマ定義

## スキーマ設計概要

本ドキュメントは、システムのデータ構造を2つの観点から定義する。

1.  **APIリクエスト/レスポンス スキーマ**: FrontendとBackendが通信する際に使用する、JSON形式のデータ構造。
2.  **Firestoreドキュメント スキーマ**: Backend内部およびFirestoreデータベースでの永続化データ構造。

### 設計原則
- **API Contract First**: APIスキーマをI/Fの正とし、Frontend/Backendはこれに準拠する。
- **Firestore最適化**: NoSQLデータベースに適した非正規化構造を許容する。
- **型安全性**: TypeScriptによる厳密な型定義で表現する。

---

## APIリクエスト/レスポンス スキーマ

このセクションでは、Frontend-Backend間のHTTP APIで交換されるJSONデータの構造を定義する。

### General

```typescript
// 標準的なエラーレスポンス
interface ErrorResponse {
  error: string;      // エラーコード (e.g., 'VALIDATION_ERROR')
  message: string;    // エラーメッセージ
  details?: any;      // 詳細情報 (バリデーションエラーの内訳など)
}
```

### Tasks

```typescript
// POST /api/families/{familyId}/tasks
interface CreateTaskRequest {
  assignee_member_id: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  due?: string; // ISO 8601 format
}

// PATCH /api/families/{familyId}/tasks/{taskId}
interface UpdateTaskRequest {
  assignee_member_id?: string;
  title?: string;
  type?: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  status?: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress?: number; // 0-100
  due?: string | null; // ISO 8601 format or null
}

// 単一タスクのレスポンス
interface TaskResponse {
  task_id: string;
  assignee_member_id: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;
  due?: string; // ISO 8601 format
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

// 複数タスクのレスポンス
interface ListTasksResponse {
  tasks: TaskResponse[];
}
```

### Evidence

```typescript
// POST /api/families/{familyId}/evidence (ファイルありの場合)
interface CreateEvidenceRequest {
  task_id?: string;
  child_member_id: string;
  kind: 'photo' | 'voice';
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
  // ファイル自体の情報はリクエストに含まれず、このAPIのレスポンスURLにアップロードする
}

// POST /api/families/{familyId}/evidence (テキストのみの場合)
interface CreateTextEvidenceRequest {
  task_id?: string;
  child_member_id: string;
  kind: 'note';
  text: string;
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
}

// ファイルアップロードURLを含むレスポンス
interface CreateEvidenceResponse {
  evidence_id: string;
  upload_url: string; // 署名付きアップロードURL
}

// 証拠データの標準レスポンス
interface EvidenceResponse {
  evidence_id: string;
  task_id?: string;
  child_member_id: string;
  kind: 'photo' | 'voice' | 'note';
  download_url?: string; // ファイル閲覧用URL
  text?: string;
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
  created_at: string; // ISO 8601 format
}

// 複数証拠データのレスポンス
interface ListEvidenceResponse {
  evidence: EvidenceResponse[];
}
```

### Members

```typescript
// POST /api/families/{familyId}/members
interface CreateMemberRequest {
  role: 'child' | 'parent';
  display_name: string;
  birth_year?: number;
}

// 単一メンバーのレスポンス
interface MemberResponse {
  member_id: string;
  role: 'child' | 'parent';
  display_name: string;
  birth_year?: number;
  member_code?: string; // Parentのみ閲覧可能
  created_at: string; // ISO 8601 format
}

// 複数メンバーのレスポンス
interface ListMembersResponse {
  members: MemberResponse[];
}
```

---

## Firestore ドキュメントスキーマ

このセクションでは、Backend内部およびFirestoreデータベースでの永続化データ構造を定義する。APIスキーマとは `created_at` の型(`Timestamp`)などが異なる点に注意。

### Family (家族) - /families/{family_id}

```typescript
interface FamilyDoc {
  family_id: string; // Document ID
  name?: string;
  storage_quota_bytes: number;
  storage_used_bytes: number;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### Member (家族構成員) - /families/{family_id}/members/{member_id}

```typescript
interface MemberDoc {
  member_id: string;
  role: 'child' | 'parent';
  display_name: string;
  birth_year?: number;
  member_code?: string;
  auth_uid?: string; // Firebase Auth UID
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### Task (タスク) - /families/{family_id}/tasks/{task_id}

```typescript
interface TaskDoc {
  task_id: string;
  assignee_member_id: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;
  due?: string; // ISO 8601 format
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### Evidence (証拠記録) - /families/{family_id}/evidence/{evidence_id}

```typescript
interface EvidenceDoc {
  evidence_id: string;
  task_id?: string;
  child_member_id: string;
  kind: 'photo' | 'voice' | 'note';
  storage_path?: string; // Firebase Storage パス
  text?: string;
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
  created_at: FirebaseFirestore.Timestamp;
}
```

### Recommendation (推奨事項) - /families/{family_id}/recommendations/{recommend_id}

```typescript
interface RecommendationDoc {
  recommend_id: string;
  target_member_id: string;
  kind: 'question' | 'book' | 'place';
  title: string;
  reason: string;
  created_at: FirebaseFirestore.Timestamp;
}
```
