# specs/01_DOMAIN.md (ドメインモデル)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ ドメインモデル・API境界設計

## ドメインモデル概要

### 分離アーキテクチャにおけるドメイン設計
- **Frontend Domain**: UI状態管理、ローカルキャッシュ、ユーザーインタラクション
- **Backend Domain**: データ永続化、ビジネスロジック、API提供
- **Shared Domain**: Frontend/Backend共通の型定義・エンティティ

## コアエンティティ

### API境界を考慮したエンティティ設計

#### 1. Family (家族)

**Frontend Model (TypeScript)**
```typescript
interface Family {
  familyId: string;              // UUID v4
  name?: string;                 // 家族名 (任意)
  storageQuotaBytes: number;     // ストレージ上限
  storageUsedBytes: number;      // 使用済みストレージ
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}
```

**Backend Model (Firestore)**
```typescript
interface FamilyDocument {
  family_id: string;                              // Document ID
  name?: string;                                  // 家族名
  storage_quota_bytes: number;                    // ストレージ上限
  storage_used_bytes: number;                     // 使用済み容量
  created_at: FirebaseFirestore.Timestamp;       // Firestore Timestamp
  updated_at: FirebaseFirestore.Timestamp;       // Firestore Timestamp
}
```

**API Contract**
```typescript
// GET /api/families/:familyId
interface FamilyResponse {
  familyId: string;
  name?: string;
  storageQuotaBytes: number;
  storageUsedBytes: number;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

// POST/PUT /api/families
interface FamilyRequest {
  name?: string;
  storageQuotaBytes?: number;
}
```

#### 2. Member (家族構成員)

**Frontend Model**
```typescript
interface Member {
  memberId: string;              // UUID v4
  familyId: string;              // Family参照
  role: 'child' | 'parent';      // 既存実装維持
  displayName: string;           // 表示名
  birthYear?: number;            // 生年 (任意)
  memberCode?: string;           // 招待用コード (任意)
  authUid?: string;              // Firebase Auth UID
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}
```

**Backend Model**
```typescript
interface MemberDocument {
  member_id: string;                              // Document ID
  family_id: string;                              // Family参照
  role: 'child' | 'parent';                       // ロール
  display_name: string;                           // 表示名
  birth_year?: number;                            // 生年
  member_code?: string;                           // 招待コード
  auth_uid?: string;                              // Firebase Auth UID
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

**API Contract**
```typescript
// GET /api/families/:familyId/members
interface MembersResponse {
  members: MemberResponse[];
}

interface MemberResponse {
  memberId: string;
  familyId: string;
  role: 'child' | 'parent';
  displayName: string;
  birthYear?: number;
  memberCode?: string;
  authUid?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/families/:familyId/members
interface CreateMemberRequest {
  role: 'child' | 'parent';
  displayName: string;
  birthYear?: number;
}
```

#### 3. Task (タスク)

**Frontend Model**
```typescript
interface Task {
  taskId: string;                // UUID v4
  familyId: string;              // Family参照
  assigneeMemberId: string;      // 担当者Member参照
  title: string;                 // タスク名
  type: 'test' | 'homework' | 'inquiry' | 'life'; // 既存実装維持
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence'; // 既存実装維持
  progress: number;              // 進捗率 (0-100)
  subject?: string;              // 科目 (任意)
  due?: string;                  // 期限 (ISO 8601)
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}
```

**Backend Model**
```typescript
interface TaskDocument {
  task_id: string;                                // Document ID
  family_id: string;                              // Family参照
  assignee_member_id: string;                     // 担当者参照
  title: string;                                  // タスク名
  type: 'test' | 'homework' | 'inquiry' | 'life'; // タスク種別
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence'; // ステータス
  progress: number;                               // 進捗率
  subject?: string;                               // 科目
  due?: string;                                   // 期限 (ISO 8601)
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

**API Contract**
```typescript
// GET /api/families/:familyId/tasks
interface TasksResponse {
  tasks: TaskResponse[];
}

interface TaskResponse {
  taskId: string;
  familyId: string;
  assigneeMemberId: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;
  subject?: string;
  due?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/families/:familyId/tasks
interface CreateTaskRequest {
  assigneeMemberId: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  due?: string;
}

// PUT /api/families/:familyId/tasks/:taskId
interface UpdateTaskRequest {
  title?: string;
  status?: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress?: number;
  subject?: string;
  due?: string;
}
```

#### 4. Evidence (証拠記録)

**Frontend Model**
```typescript
interface Evidence {
  evidenceId: string;            // UUID v4
  familyId: string;              // Family参照
  taskId?: string;               // Task参照 (任意)
  childMemberId: string;         // 記録者Member参照
  kind: 'photo' | 'voice' | 'note'; // 既存実装維持
  blobRef?: string;              // File参照 (Storage URL)
  text?: string;                 // テキスト内容
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>; // 既存実装維持
  createdAt: number;             // Unix timestamp
}
```

**Backend Model**
```typescript
interface EvidenceDocument {
  evidence_id: string;                            // Document ID
  family_id: string;                              // Family参照
  task_id?: string;                               // Task参照
  child_member_id: string;                        // 記録者参照
  kind: 'photo' | 'voice' | 'note';               // 証拠種別
  blob_ref?: string;                              // Firebase Storage パス
  text?: string;                                  // テキスト内容
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>; // タグ
  created_at: FirebaseFirestore.Timestamp;
}
```

**API Contract**
```typescript
// GET /api/families/:familyId/evidence
interface EvidenceListResponse {
  evidence: EvidenceResponse[];
}

interface EvidenceResponse {
  evidenceId: string;
  familyId: string;
  taskId?: string;
  childMemberId: string;
  kind: 'photo' | 'voice' | 'note';
  blobRef?: string;
  text?: string;
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
  createdAt: string;
}

// POST /api/families/:familyId/evidence
interface CreateEvidenceRequest {
  taskId?: string;
  childMemberId: string;
  kind: 'photo' | 'voice' | 'note';
  text?: string;
  tags?: Array<'observe' | 'compare' | 'hypothesize' | 'express'>;
}

// POST /api/families/:familyId/evidence/:evidenceId/file
// Content-Type: multipart/form-data
interface UploadEvidenceFileRequest {
  file: File; // Binary file data
}
```

#### 5. Recommendation (推奨事項)

**Frontend Model**
```typescript
interface Recommendation {
  recommendId: string;           // UUID v4
  familyId: string;              // Family参照
  targetMemberId: string;        // 対象者Member参照
  kind: 'question' | 'book' | 'place'; // 既存実装維持
  title: string;                 // 推奨タイトル
  reason: string;                // 推奨理由
  createdAt: number;             // Unix timestamp
}
```

**Backend Model**
```typescript
interface RecommendationDocument {
  recommend_id: string;                           // Document ID
  family_id: string;                              // Family参照
  target_member_id: string;                       // 対象者参照
  kind: 'question' | 'book' | 'place';            // 推奨種別
  title: string;                                  // 推奨タイトル
  reason: string;                                 // 推奨理由
  created_at: FirebaseFirestore.Timestamp;
}
```

**API Contract**
```typescript
// GET /api/families/:familyId/recommendations
interface RecommendationsResponse {
  recommendations: RecommendationResponse[];
}

interface RecommendationResponse {
  recommendId: string;
  familyId: string;
  targetMemberId: string;
  kind: 'question' | 'book' | 'place';
  title: string;
  reason: string;
  createdAt: string;
}

// POST /api/families/:familyId/recommendations
interface CreateRecommendationRequest {
  targetMemberId: string;
  kind: 'question' | 'book' | 'place';
  title: string;
  reason: string;
}
```

## 値オブジェクト

### Frontend/Backend共通 値オブジェクト

```typescript
// UUID v4生成・検証
class EntityId {
  constructor(private readonly value: string) {
    if (!this.isValidUUID(value)) {
      throw new Error('Invalid UUID format');
    }
  }

  toString(): string {
    return this.value;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static generate(): EntityId {
    return new EntityId(crypto.randomUUID());
  }
}

// 型安全なID管理
export type FamilyId = EntityId;
export type MemberId = EntityId;
export type TaskId = EntityId;
export type EvidenceId = EntityId;
export type RecommendationId = EntityId;
```

## ドメインサービス

### Frontend ドメインサービス
```typescript
// API Client抽象化
interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete(endpoint: string): Promise<void>;
  upload(endpoint: string, file: File): Promise<string>;
}

// 認証状態管理
interface AuthService {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getAuthToken(): Promise<string>;
}
```

### Backend ドメインサービス
```typescript
// Firestore Repository抽象化
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findByFamily(familyId: string): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// ファイル管理サービス
interface FileStorageService {
  upload(familyId: string, file: Buffer, metadata: FileMetadata): Promise<string>;
  delete(filePath: string): Promise<void>;
  getDownloadUrl(filePath: string): Promise<string>;
}
```

## データ変換・マッピング

### Frontend/Backend変換ルール

```typescript
// Frontend → API Request変換
class TaskMapper {
  static toCreateRequest(task: Partial<Task>): CreateTaskRequest {
    return {
      assigneeMemberId: task.assigneeMemberId!,
      title: task.title!,
      type: task.type!,
      subject: task.subject,
      due: task.due
    };
  }

  static fromApiResponse(response: TaskResponse): Task {
    return {
      taskId: response.taskId,
      familyId: response.familyId,
      assigneeMemberId: response.assigneeMemberId,
      title: response.title,
      type: response.type,
      status: response.status,
      progress: response.progress,
      subject: response.subject,
      due: response.due,
      createdAt: new Date(response.createdAt).getTime(),
      updatedAt: new Date(response.updatedAt).getTime()
    };
  }
}

// Backend: API → Firestore変換
class TaskDocumentMapper {
  static toFirestore(request: CreateTaskRequest, familyId: string): Omit<TaskDocument, 'created_at' | 'updated_at'> {
    return {
      task_id: crypto.randomUUID(),
      family_id: familyId,
      assignee_member_id: request.assigneeMemberId,
      title: request.title,
      type: request.type,
      status: 'todo',
      progress: 0,
      subject: request.subject,
      due: request.due
    };
  }

  static toApiResponse(doc: TaskDocument): TaskResponse {
    return {
      taskId: doc.task_id,
      familyId: doc.family_id,
      assigneeMemberId: doc.assignee_member_id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      progress: doc.progress,
      subject: doc.subject,
      due: doc.due,
      createdAt: doc.created_at.toDate().toISOString(),
      updatedAt: doc.updated_at.toDate().toISOString()
    };
  }
}
```

## ドメインルール・制約

### ビジネスルール
1. **Family境界**: 全てのデータはFamily境界内でのみアクセス可能
2. **Role制約**: Childは自分のTask・Evidenceのみ操作可能
3. **Task進捗**: progressは0-100の範囲のみ有効
4. **Evidence制約**: Evidenceは作成後変更不可 (Immutable)

### API制約
1. **認証必須**: 全APIエンドポイントで認証トークン必須
2. **Family検証**: リクエスト内のfamilyIdとユーザーの所属Family一致必須
3. **ファイルサイズ**: Evidence添付ファイルは50MB以下
4. **レート制限**: ユーザー毎の API呼び出し回数制限