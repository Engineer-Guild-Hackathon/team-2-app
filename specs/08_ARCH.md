# specs/08_ARCH.md (アーキテクチャ詳細設計)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ 分離アーキテクチャ詳細設計

## アーキテクチャ概要

### 分離アーキテクチャ設計原則
- **関心の分離**: Frontend (UI/UX) と Backend (API/Data) の明確な責任分離
- **独立デプロイ**: 各アプリケーションの独立したデプロイ・スケーリング
- **API Contract**: 明確なAPIインターフェースによる疎結合
- **技術選択の自由**: Frontend/Backend各々の最適な技術スタック選択

## システム全体アーキテクチャ

### 高レベル構成図
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
│              (React + TypeScript + Dexie)                  │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                     │
│  ├── components/features/ (Task, Evidence, Member UI)      │
│  ├── components/layout/   (Header, Sidebar, Layout)        │
│  └── components/ui/       (Button, Card, Input等)          │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (Hooks & State Management)              │
│  └── hooks/useAppData.ts (既存State Management)            │
├─────────────────────────────────────────────────────────────┤
│  UseCase Layer (Business Logic)                            │
│  ├── taskService.ts      (Task管理 + API Client)           │
│  ├── evidenceService.ts  (Evidence管理 + API Client)       │
│  ├── memberService.ts    (Member管理 + API Client)         │
│  └── apiClient.ts        (新規: HTTP API Client)           │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Data Access)                        │
│  ├── db/dexieDB.ts      (ローカルキャッシュ: 既存維持)     │
│  ├── api/httpClient.ts  (新規: HTTP Client実装)            │
│  └── auth/authService.ts (新規: Firebase Auth統合)         │
└─────────────────────────────────────────────────────────────┘
                                ↓ HTTP/HTTPS API
┌─────────────────────────────────────────────────────────────┐
│                    Backend Application                      │
│                (Firebase Functions + Firestore)            │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Express/Fastify Routes)                        │
│  ├── routes/families.ts     (Family管理API)                │
│  ├── routes/members.ts      (Member管理API)                │
│  ├── routes/tasks.ts        (Task管理API)                  │
│  ├── routes/evidence.ts     (Evidence管理API)              │
│  └── middleware/auth.ts     (JWT認証ミドルウェア)          │
├─────────────────────────────────────────────────────────────┤
│  UseCase Layer (Business Logic)                            │
│  ├── usecases/familyUseCase.ts   (Family業務ロジック)      │
│  ├── usecases/taskUseCase.ts     (Task業務ロジック)        │
│  ├── usecases/evidenceUseCase.ts (Evidence業務ロジック)    │
│  └── usecases/authUseCase.ts     (認証業務ロジック)        │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (Entities & Value Objects)                   │
│  ├── entities/family.ts         (Familyエンティティ)       │
│  ├── entities/member.ts         (Memberエンティティ)       │
│  ├── entities/task.ts           (Taskエンティティ)         │
│  ├── valueObjects/entityId.ts   (ID値オブジェクト)         │
│  └── repositories/              (Repository インターフェース) │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Data Access)                        │
│  ├── firestore/                                            │
│  │   ├── repositories/familyRepository.ts                  │
│  │   ├── repositories/taskRepository.ts                    │
│  │   ├── repositories/evidenceRepository.ts                │
│  │   └── config/firestoreConfig.ts                         │
│  ├── storage/fileStorageService.ts                         │
│  └── auth/firebaseAuthService.ts                           │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                       │
├─────────────────────────────────────────────────────────────┤
│  Firestore          │  Firebase Storage  │  Firebase Auth  │
│  (Primary DB)       │  (File Storage)    │  (Authentication)│
│  + Security Rules   │  + Security Rules  │  + JWT Token    │
└─────────────────────────────────────────────────────────────┘
```

## Frontend詳細アーキテクチャ

### Frontend層別詳細設計

#### Presentation Layer (React Components)
```typescript
// 既存Component構造を維持しつつAPI統合
src/components/
├── features/
│   ├── Dashboard.tsx           (既存UI維持)
│   ├── TaskList.tsx           (API Client統合)
│   ├── TaskCard.tsx           (API Client統合)
│   ├── EvidenceUpload.tsx     (ファイルAPI統合)
│   └── MemberList.tsx         (API Client統合)
├── layout/
│   ├── Header.tsx             (認証状態表示)
│   ├── Sidebar.tsx            (既存維持)
│   └── Layout.tsx             (既存維持)
└── ui/                        (既存UI Components維持)
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

#### UseCase Layer拡張 (API Client統合)
```typescript
// src/usecase/taskService.ts 拡張例
export class TaskService {
  constructor(
    private apiClient: ApiClient,        // 新規: HTTP API Client
    private dexieRepo: DexieTaskRepository, // 既存: ローカルキャッシュ
    private authService: AuthService      // 新規: 認証状態管理
  ) {}

  async getAllTasks(familyId: string): Promise<Task[]> {
    try {
      // 1. API から最新データ取得
      const apiTasks = await this.apiClient.get<TasksResponse>(
        `/api/families/${familyId}/tasks`
      );

      // 2. ローカルキャッシュ更新
      await this.dexieRepo.bulkUpdate(
        apiTasks.tasks.map(t => TaskMapper.fromApiResponse(t))
      );

      // 3. 変換済みデータ返却
      return apiTasks.tasks.map(t => TaskMapper.fromApiResponse(t));
    } catch (error) {
      // 4. オフライン時: ローカルキャッシュフォールバック
      console.warn('API failed, falling back to cache:', error);
      return await this.dexieRepo.getAllByFamily(familyId);
    }
  }

  async addTask(familyId: string, taskData: CreateTaskData): Promise<Task> {
    const request = TaskMapper.toCreateRequest(taskData);

    try {
      // 1. API にTask作成リクエスト
      const apiTask = await this.apiClient.post<TaskResponse>(
        `/api/families/${familyId}/tasks`,
        request
      );

      // 2. ローカルキャッシュ更新
      const task = TaskMapper.fromApiResponse(apiTask);
      await this.dexieRepo.create(task);

      return task;
    } catch (error) {
      // 3. オフライン時: ローカル作成 + 同期キュー
      const task = this.createLocalTask(familyId, taskData);
      await this.dexieRepo.create(task);
      await this.queueForSync('create', task);

      return task;
    }
  }
}
```

#### Infrastructure Layer拡張
```typescript
// src/infrastructure/api/httpClient.ts 新規実装
export class HttpClient implements ApiClient {
  constructor(
    private baseUrl: string,
    private authService: AuthService
  ) {}

  async get<T>(endpoint: string): Promise<T> {
    const token = await this.authService.getAuthToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const token = await this.authService.getAuthToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }

    return response.json();
  }

  async upload(endpoint: string, file: File): Promise<string> {
    const token = await this.authService.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }

    const result = await response.json();
    return result.downloadUrl;
  }
}
```

## Backend詳細アーキテクチャ

### Backend層別詳細設計

#### API Layer (Firebase Functions + Express)
```typescript
// backend/functions/src/routes/tasks.ts
import { Router } from 'express';
import { TaskUseCase } from '../usecases/taskUseCase';
import { authenticateToken, validateFamilyAccess } from '../middleware/auth';

const router = Router();
const taskUseCase = new TaskUseCase();

// GET /api/families/:familyId/tasks
router.get('/:familyId/tasks',
  authenticateToken,
  validateFamilyAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { familyId } = req.params;
      const { assignee, status, limit = 100, offset = 0 } = req.query;

      const tasks = await taskUseCase.getTasks(familyId, {
        assignee: assignee as string,
        status: status as TaskStatus,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({ tasks });
    } catch (error) {
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }
);

// POST /api/families/:familyId/tasks
router.post('/:familyId/tasks',
  authenticateToken,
  validateFamilyAccess,
  validateCreateTaskRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { familyId } = req.params;
      const taskData = req.body as CreateTaskRequest;

      const task = await taskUseCase.createTask(familyId, taskData);

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details
        });
      } else {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  }
);

export { router as taskRouter };
```

#### UseCase Layer (Business Logic)
```typescript
// backend/functions/src/usecases/taskUseCase.ts
export class TaskUseCase {
  constructor(
    private taskRepository: TaskRepository,
    private memberRepository: MemberRepository
  ) {}

  async createTask(familyId: string, request: CreateTaskRequest): Promise<TaskResponse> {
    // 1. バリデーション
    await this.validateCreateTaskRequest(familyId, request);

    // 2. Taskエンティティ生成
    const taskEntity = TaskEntity.create({
      familyId,
      assigneeMemberId: request.assigneeMemberId,
      title: request.title,
      type: request.type,
      subject: request.subject,
      due: request.due
    });

    // 3. Firestore保存
    const savedTask = await this.taskRepository.create(taskEntity);

    // 4. API Response形式に変換
    return TaskMapper.toApiResponse(savedTask);
  }

  async getTasks(familyId: string, filters: TaskFilters): Promise<TaskResponse[]> {
    // 1. Repository経由でFirestore検索
    const tasks = await this.taskRepository.findByFamily(familyId, filters);

    // 2. API Response形式に変換
    return tasks.map(task => TaskMapper.toApiResponse(task));
  }

  private async validateCreateTaskRequest(familyId: string, request: CreateTaskRequest): Promise<void> {
    // 担当者がFamily内に存在するかチェック
    const assignee = await this.memberRepository.findById(request.assigneeMemberId);
    if (!assignee || assignee.familyId !== familyId) {
      throw new ValidationError('Assignee must be a member of this family');
    }

    // その他ビジネスルール検証
    if (request.title.length > 200) {
      throw new ValidationError('Title must be 200 characters or less');
    }
  }
}
```

#### Infrastructure Layer (Firestore操作)
```typescript
// backend/functions/src/infrastructure/firestore/repositories/taskRepository.ts
export class FirestoreTaskRepository implements TaskRepository {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async create(task: TaskEntity): Promise<TaskEntity> {
    const taskDoc = TaskDocumentMapper.toFirestore(task);
    const docRef = this.db
      .collection('families')
      .doc(task.familyId)
      .collection('tasks')
      .doc(task.taskId);

    await docRef.set(taskDoc);

    return task;
  }

  async findByFamily(familyId: string, filters: TaskFilters): Promise<TaskEntity[]> {
    let query = this.db
      .collection('families')
      .doc(familyId)
      .collection('tasks') as any;

    // フィルタ適用
    if (filters.assignee) {
      query = query.where('assignee_member_id', '==', filters.assignee);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    // ソート・ページネーション
    query = query
      .orderBy('created_at', 'desc')
      .limit(filters.limit || 100);

    if (filters.offset) {
      // offsetベースのページネーション（実装時は効率化要検討）
      query = query.offset(filters.offset);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc =>
      TaskDocumentMapper.fromFirestore(doc.data())
    );
  }

  async findById(taskId: string, familyId: string): Promise<TaskEntity | null> {
    const docRef = this.db
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .doc(taskId);

    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return TaskDocumentMapper.fromFirestore(doc.data()!);
  }

  async update(task: TaskEntity): Promise<TaskEntity> {
    const taskDoc = TaskDocumentMapper.toFirestore(task);
    const docRef = this.db
      .collection('families')
      .doc(task.familyId)
      .collection('tasks')
      .doc(task.taskId);

    await docRef.update({
      ...taskDoc,
      updated_at: FieldValue.serverTimestamp()
    });

    return task;
  }

  async delete(taskId: string, familyId: string): Promise<void> {
    const docRef = this.db
      .collection('families')
      .doc(familyId)
      .collection('tasks')
      .doc(taskId);

    await docRef.delete();
  }
}
```

## データフロー設計

### 標準的なCRUD操作フロー

#### Create操作 (Task作成例)
```
Frontend:
1. UI: Task作成フォーム送信
2. TaskService.addTask() 呼び出し
3. API Client: POST /api/families/:id/tasks
4. AuthService: Firebase Auth Token取得・付与

Backend:
5. Express Middleware: JWT Token検証
6. Express Middleware: Family境界チェック
7. TaskUseCase.createTask(): ビジネスロジック実行
8. TaskRepository.create(): Firestore書き込み
9. API Response: 作成されたTask情報返却

Frontend:
10. API Response受信
11. Local Cache (Dexie): Task情報更新
12. UI: 画面更新・成功通知表示
```

#### Read操作 (Task一覧取得例)
```
Frontend:
1. UI: Task一覧画面表示
2. TaskService.getAllTasks() 呼び出し
3. Local Cache確認: 既存データ即座表示
4. API Client: GET /api/families/:id/tasks (バックグラウンド)

Backend:
5. Express Middleware: 認証・認可チェック
6. TaskUseCase.getTasks(): フィルタ・ページネーション適用
7. TaskRepository.findByFamily(): Firestore検索
8. API Response: Task一覧返却

Frontend:
9. API Response受信
10. Local Cache更新: 最新データで同期
11. UI: リアルタイム更新表示
```

### エラーハンドリングフロー

#### API障害時のフォールバック
```
Frontend:
1. API Client: HTTP Request送信
2. Network Error / Server Error発生
3. TaskService: エラーハンドリング実行
4. Local Cache (Dexie): フォールバックデータ取得
5. UI: オフライン状態表示 + キャッシュデータ表示
6. Background: 同期キュー追加 (オフライン操作)

Online復帰時:
7. Network状態監視: オンライン復帰検知
8. Sync Service: キューイング済み操作実行
9. API Client: 蓄積された操作順次送信
10. UI: 同期完了通知・正常状態復帰
```

### ファイルアップロードフロー
```
Frontend:
1. UI: ファイル選択・アップロード開始
2. EvidenceService.uploadEvidence() 呼び出し
3. Validation: ファイルサイズ・形式チェック
4. API Client: POST /api/families/:id/evidence (メタデータ)
5. API Client: POST /api/families/:id/evidence/:id/file (バイナリ)

Backend:
6. Express: Evidence メタデータ作成
7. Firestore: Evidence Document保存
8. Firebase Storage: ファイルアップロード
9. API Response: Evidence情報 + Download URL返却

Frontend:
10. API Response受信
11. Local Cache: Evidence情報保存
12. UI: アップロード完了・プレビュー表示
```

## セキュリティアーキテクチャ

### 認証・認可フロー
```
1. Frontend: Firebase Auth ログイン
2. Frontend: ID Token取得
3. API Request: Authorization Header付与
4. Backend Middleware: Token検証
5. Backend Middleware: Family境界チェック
6. Backend UseCase: ビジネスロジック実行
7. Firestore Security Rules: 最終セキュリティチェック
```

### Firestore Security Rules設計
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Family境界の厳格な制御
    match /families/{family_id} {
      allow read, write: if request.auth != null &&
                            isFamilyMember(family_id);

      match /tasks/{task_id} {
        allow read: if isAuthenticated() && isFamilyMember(family_id);
        allow write: if isAuthenticated() && (
          isParentInFamily(family_id) ||
          (isChildInFamily(family_id) &&
           resource.data.assignee_member_id == request.auth.uid)
        );
      }
    }
  }
}
```

## パフォーマンス最適化設計

### キャッシュ戦略
1. **L1 Cache**: React State (即座のUI応答)
2. **L2 Cache**: Dexie IndexedDB (永続化・オフライン対応)
3. **L3 Data**: Firestore (真実の源泉)

### クエリ最適化
- Firestore Complex Index活用
- ページネーション実装
- 並行処理・非同期処理最大活用

### ファイル配信最適化
- Firebase Storage CDN活用
- 署名付きURL生成
- 適切なキャッシュヘッダー設定

## 運用・監視設計

### ログ・監視ポイント
- Frontend: エラー追跡・ユーザー行動分析
- Backend: API監視・パフォーマンス監視
- Firebase: 使用量・セキュリティ監視

### デプロイ・CI/CD
- Frontend: Vercel/Netlify自動デプロイ
- Backend: Firebase Functions自動デプロイ
- 独立したリリースサイクル管理