# specs/09_GUIDELINES.md (開発ガイドライン)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ 分離デプロイ開発ガイドライン

## 開発ガイドライン概要

frontend/の既存実装と新規backend/の開発における、モノレポ管理・分離デプロイ・API統合のベストプラクティスを定義

### 基本方針
- **モノレポ管理**: frontend/ + backend/ の効率的な共同開発
- **既存規約継続**: frontend/の開発規約を最大限維持
- **分離デプロイ**: 各アプリケーションの独立したリリースサイクル
- **API Contract**: 明確なインターフェース設計による疎結合
- **チーム協働**: Frontend/Backend担当者間の効率的協働

## モノレポ構成と命名規約

### モノレポ全体構造
```
team-2-app/
├── frontend/                   (React アプリケーション)
│   ├── src/
│   │   ├── components/        (既存継続)
│   │   │   ├── features/     (既存UI Components)
│   │   │   ├── layout/       (既存Layout Components)
│   │   │   └── ui/           (既存UI Components)
│   │   ├── hooks/            (既存継続)
│   │   │   └── useAppData.ts (既存Hook + API統合)
│   │   ├── usecase/          (既存拡張: API Client統合)
│   │   │   ├── taskService.ts      (API Client統合)
│   │   │   ├── evidenceService.ts  (API Client統合)
│   │   │   ├── memberService.ts    (API Client統合)
│   │   │   └── apiClient.ts        (新規: HTTP Client)
│   │   ├── domain/           (既存継続)
│   │   │   ├── entities.ts   (既存Entity定義維持)
│   │   │   ├── valueObjects.ts
│   │   │   ├── repositories.ts
│   │   │   └── services.ts
│   │   └── infrastructure/   (既存 + API Client追加)
│   │       ├── db/           (既存Dexie: ローカルキャッシュ)
│   │       ├── api/          (新規: HTTP API Client)
│   │       └── auth/         (新規: Firebase Auth統合)
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/                    (Firebase Functions API)
│   ├── functions/
│   │   ├── src/
│   │   │   ├── routes/       (API Routes)
│   │   │   │   ├── families.ts
│   │   │   │   ├── members.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   └── evidence.ts
│   │   │   ├── usecases/     (Business Logic)
│   │   │   │   ├── familyUseCase.ts
│   │   │   │   ├── taskUseCase.ts
│   │   │   │   └── evidenceUseCase.ts
│   │   │   ├── domain/       (Entities & Value Objects)
│   │   │   │   ├── entities/
│   │   │   │   ├── valueObjects/
│   │   │   │   └── repositories/
│   │   │   ├── infrastructure/ (Firestore実装)
│   │   │   │   ├── firestore/
│   │   │   │   ├── storage/
│   │   │   │   └── auth/
│   │   │   ├── middleware/   (認証・バリデーション)
│   │   │   └── index.ts      (Express App)
│   │   ├── package.json
│   │   └── ...
│   ├── firestore.rules       (Security Rules)
│   ├── storage.rules         (Storage Rules)
│   ├── firebase.json
│   └── ...
├── specs/                      (共通仕様書)
└── shared/                     (共通型定義: 将来拡張)
    └── types/
        └── api.ts              (API Contract型定義)
```

### 命名規約

#### モノレポ共通命名規約
- **frontend/**: 既存規約継続 (camelCase for files, PascalCase for Components)
- **backend/**: Node.js規約 (camelCase files, PascalCase Classes)
- **API関連**: REST規約 (kebab-case endpoints, camelCase JSON)
- **共通型**: PascalCase interfaces, camelCase properties

#### ファイル・ディレクトリ命名
```typescript
// Frontend (既存継続)
frontend/src/components/TaskCard.tsx     // PascalCase Components
frontend/src/usecase/taskService.ts      // camelCase services
frontend/src/infrastructure/api/httpClient.ts // camelCase + 機能別

// Backend (新規)
backend/functions/src/routes/tasks.ts    // kebab-case REST resources
backend/functions/src/usecases/taskUseCase.ts // camelCase + UseCase suffix
backend/functions/src/infrastructure/firestore/repositories/taskRepository.ts

// 共通 (API Contract)
shared/types/api.ts                      // API型定義
specs/04_API.md                          // API仕様書
```

#### 変数・関数命名規約
```typescript
// Frontend (既存継続)
const taskData = { ... };               // camelCase
const TaskComponent = () => { ... };     // PascalCase Components
const apiClient = new HttpClient();      // API関連
const handleApiError = () => {};         // API error handling

// Backend (新規)
const taskEntity = { ... };             // camelCase entities
const TaskUseCase = class { ... };       // PascalCase classes
const toApiResponse = () => {};          // API変換関数
const validateTaskRequest = () => {};     // バリデーション関数

// API Contract (共通)
interface CreateTaskRequest { ... }      // PascalCase + Request suffix
interface TaskResponse { ... }           // PascalCase + Response suffix
```

## コーディング規約

### TypeScript型定義戦略

#### Frontend型定義 (既存継続)
```typescript
// frontend/src/domain/entities.ts (既存維持)
interface Task {
  taskId: string;                 // UUID v4
  familyId: string;               // Family参照
  assigneeMemberId: string;       // Member参照
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;               // 0-100
  subject?: string;
  due?: string;                   // ISO 8601
  createdAt: number;              // Unix timestamp
  updatedAt: number;              // Unix timestamp
}
```

#### Backend型定義 (新規)
```typescript
// backend/functions/src/domain/entities/task.ts
export class TaskEntity {
  constructor(
    public readonly taskId: string,
    public readonly familyId: string,
    public readonly assigneeMemberId: string,
    public readonly title: string,
    public readonly type: TaskType,
    public readonly status: TaskStatus,
    public readonly progress: number,
    public readonly subject?: string,
    public readonly due?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(data: CreateTaskData): TaskEntity {
    return new TaskEntity(
      crypto.randomUUID(),
      data.familyId,
      data.assigneeMemberId,
      data.title,
      data.type,
      'todo',
      0,
      data.subject,
      data.due,
      new Date(),
      new Date()
    );
  }
}
```

#### API Contract型定義 (共通)
```typescript
// shared/types/api.ts
// API Request/Response型定義
export interface CreateTaskRequest {
  assigneeMemberId: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  subject?: string;
  due?: string;
}

export interface TaskResponse {
  taskId: string;
  familyId: string;
  assigneeMemberId: string;
  title: string;
  type: 'test' | 'homework' | 'inquiry' | 'life';
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence';
  progress: number;
  subject?: string;
  due?: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// Firestore Document型定義
export interface TaskDocument {
  task_id: string;
  family_id: string;
  assignee_member_id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  subject?: string;
  due?: string;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

#### Repository パターン定義

##### Frontend Repository (既存拡張)
```typescript
// frontend/src/domain/repositories.ts (既存拡張)
interface TaskRepository {
  // 既存メソッド継続
  create(task: Task): Promise<Task>;
  findById(taskId: string): Promise<Task | null>;
  update(task: Task): Promise<Task>;
  delete(taskId: string): Promise<void>;
  getAllByFamily(familyId: string): Promise<Task[]>;

  // API統合用メソッド (新規)
  syncFromApi(apiTasks: Task[]): Promise<void>;
  queueForSync(operation: 'create' | 'update' | 'delete', task: Task): Promise<void>;
  getUnsyncedOperations(): Promise<SyncOperation[]>;
}
```

##### Backend Repository (新規)
```typescript
// backend/functions/src/domain/repositories/taskRepository.ts
export interface TaskRepository {
  create(task: TaskEntity): Promise<TaskEntity>;
  findById(taskId: string, familyId: string): Promise<TaskEntity | null>;
  findByFamily(familyId: string, filters?: TaskFilters): Promise<TaskEntity[]>;
  update(task: TaskEntity): Promise<TaskEntity>;
  delete(taskId: string, familyId: string): Promise<void>;
}

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

  // その他実装...
}
```

### エラーハンドリング規約

#### Frontend エラーハンドリング
```typescript
// frontend/src/domain/errors.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
}

// API通信エラー
export class ApiError extends AppError {
  readonly code = 'API_ERROR';

  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: any
  ) {
    super(message);
  }
}

// ネットワークエラー
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';

  constructor(message: string) {
    super(message);
  }
}

// バリデーションエラー
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
  }
}
```

#### Backend エラーハンドリング
```typescript
// backend/functions/src/domain/errors.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

// バリデーションエラー
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message);
  }
}

// 認証エラー
export class AuthenticationError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

// 認可エラー
export class AuthorizationError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

// リソース未発見エラー
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(
    public readonly resource: string,
    public readonly id: string
  ) {
    super(`${resource} with id ${id} not found`);
  }
}
```

## テスト規約

### モノレポテスト戦略

#### Frontend テスト構成 (既存継続 + API統合)
```typescript
// frontend/src/test/
├── components/         (既存Component Tests継続)
│   ├── childDashboard.mood.test.tsx
│   └── childEvidenceUpload.preselect.test.tsx
├── domain/             (既存Domain Tests継続)
│   ├── services.test.ts
│   └── valueObjects.test.ts
├── usecase/            (既存UseCase Tests + API統合)
│   ├── taskService.test.ts          (API Client統合テスト)
│   ├── memberService.test.ts        (API Client統合テスト)
│   ├── secureBackupService.test.ts  (既存継続)
│   └── backupService.test.ts        (既存継続)
├── infrastructure/     (既存 + API Client Tests)
│   ├── encryptionService.test.ts    (既存継続)
│   ├── api/            (新規: API Client Tests)
│   │   ├── httpClient.test.ts
│   │   └── apiError.test.ts
│   └── auth/           (新規: 認証Tests)
│       └── authService.test.ts
└── integration/        (新規: API統合Tests)
    ├── taskApiIntegration.test.ts
    ├── evidenceApiIntegration.test.ts
    └── offlineSync.test.ts
```

#### Backend テスト構成 (新規)
```typescript
// backend/functions/src/test/
├── unit/
│   ├── usecases/
│   │   ├── taskUseCase.test.ts
│   │   ├── evidenceUseCase.test.ts
│   │   └── memberUseCase.test.ts
│   ├── domain/
│   │   ├── entities/
│   │   └── valueObjects/
│   └── infrastructure/
│       ├── firestore/
│       │   ├── taskRepository.test.ts
│       │   └── evidenceRepository.test.ts
│       └── auth/
│           └── firebaseAuth.test.ts
├── integration/
│   ├── api/
│   │   ├── taskApi.test.ts
│   │   ├── evidenceApi.test.ts
│   │   └── memberApi.test.ts
│   └── firestore/
│       ├── firestoreIntegration.test.ts
│       └── securityRules.test.ts
└── e2e/
    ├── taskWorkflow.test.ts
    ├── evidenceWorkflow.test.ts
    └── authWorkflow.test.ts
```

### テスト命名規約 (モノレポ対応)

#### Frontend テスト命名 (既存継続 + API統合)
```typescript
// frontend/src/test/usecase/taskService.test.ts
describe('TaskService', () => {
  describe('getAllTasks', () => {
    it('should fetch tasks from API and update cache', async () => {
      // API統合テスト
    });

    it('should fallback to cache when API fails', async () => {
      // オフライン対応テスト
    });

    it('should handle API authentication errors', async () => {
      // 認証エラーハンドリング
    });
  });

  describe('addTask', () => {
    it('should create task via API and update cache', async () => {
      // 既存テスト + API統合
    });

    it('should queue task for sync when offline', async () => {
      // オフライン操作キューイング
    });
  });
});
```

#### Backend テスト命名 (新規)
```typescript
// backend/functions/src/test/unit/usecases/taskUseCase.test.ts
describe('TaskUseCase', () => {
  describe('createTask', () => {
    it('should create task with valid data', async () => {
      // 正常系テスト
    });

    it('should throw ValidationError for invalid assignee', async () => {
      // バリデーションエラーテスト
    });

    it('should enforce family boundary constraints', async () => {
      // セキュリティテスト
    });
  });
});

// backend/functions/src/test/integration/api/taskApi.test.ts
describe('Task API Endpoints', () => {
  describe('POST /api/families/:familyId/tasks', () => {
    it('should create task with valid authentication', async () => {
      // 認証付きAPI統合テスト
    });

    it('should reject request without authentication', async () => {
      // 認証チェックテスト
    });

    it('should enforce family boundary access', async () => {
      // 認可チェックテスト
    });
  });
});
```

## Git・コミット規約 (モノレポ対応)

### ブランチ戦略
- **main**: 本番リリース用
- **dev**: 開発統合用 (既存: 現在のデフォルトブランチ)
- **feature/**: 機能開発用 (スコープ別)
  - `feature/frontend-api-integration` (Frontend API統合)
  - `feature/backend-firestore-setup` (Backend Firestore構築)
  - `feature/auth-integration` (認証統合)
  - `feature/file-upload-api` (ファイルアップロードAPI)

### コミットメッセージ規約 (モノレポ対応)
```bash
# Frontend変更 (既存規約継続 + API統合)
feat(frontend): integrate task API client with existing service
fix(frontend): handle API authentication errors gracefully
refactor(frontend): extract HTTP client configuration
test(frontend): add API integration tests for task service

# Backend変更 (新規)
feat(backend): implement task API endpoints with Firestore
fix(backend): resolve Firestore security rules validation
refactor(backend): extract common repository patterns
test(backend): add unit tests for task use cases

# モノレポ共通
feat(api): define task API contract types
fix(deps): update shared dependencies for security
chore(monorepo): configure workspace build scripts
test(integration): add end-to-end task workflow tests

# スコープ別分類
feat(auth): implement Firebase Auth integration    # 認証機能
feat(files): add Evidence file upload API         # ファイル機能
feat(sync): implement offline operation queue     # 同期機能
feat(security): add Firestore security rules      # セキュリティ
```

## 環境・デプロイ規約 (分離デプロイ)

### Frontend環境設定
```typescript
// frontend/src/config/environment.ts
interface FrontendConfig {
  // API設定
  api: {
    baseUrl: string;                    // Backend API URL
    timeout: number;
    retryAttempts: number;
  };

  // Firebase Client設定
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };

  // アプリ設定
  app: {
    name: 'homelog';
    version: string;
    buildDate: string;
    environment: 'development' | 'staging' | 'production';
  };

  // 開発設定
  development: {
    enableDevTools: boolean;
    mockApi: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// 環境別設定
const config: Record<string, FrontendConfig> = {
  development: {
    api: {
      baseUrl: 'http://localhost:5001/your-project/us-central1/api',
      timeout: 10000,
      retryAttempts: 3
    },
    // ...
  },
  production: {
    api: {
      baseUrl: 'https://your-project.cloudfunctions.net/api',
      timeout: 5000,
      retryAttempts: 2
    },
    // ...
  }
};
```

### Backend環境設定
```typescript
// backend/functions/src/config/environment.ts
interface BackendConfig {
  // Firebase Admin設定
  firebase: {
    projectId: string;
    databaseURL: string;
    storageBucket: string;
  };

  // API設定
  api: {
    cors: {
      origin: string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };

  // セキュリティ設定
  security: {
    jwtSecret: string;
    encryptionKey: string;
    allowedOrigins: string[];
  };

  // アプリ設定
  app: {
    environment: 'development' | 'staging' | 'production';
    logLevel: string;
    version: string;
  };
}
```

### デプロイ設定

#### Frontend デプロイ (Vercel/Netlify)
```bash
# frontend/package.json scripts
{
  "scripts": {
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "deploy:staging": "npm run build:staging && vercel --prod",
    "deploy:production": "npm run build:production && vercel --prod"
  }
}

# frontend/vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": "dist"
}
```

#### Backend デプロイ (Firebase Functions)
```bash
# backend/package.json scripts
{
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy:staging": "npm run build && firebase deploy --only functions --project staging",
    "deploy:production": "npm run build && firebase deploy --only functions --project production"
  }
}

# backend/firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

## チーム協働規約 (モノレポ対応)

### Frontend/Backend責任分担

#### Frontend担当範囲 (frontend/)
- [ ] React Components実装・保守 (既存継続)
- [ ] TypeScript型定義管理 (frontend/ スコープ)
- [ ] Dexie ローカルキャッシュ実装 (既存継続)
- [ ] HTTP API Client実装
- [ ] Firebase Auth クライアント統合
- [ ] UI/UX テスト・Component テスト
- [ ] Frontend ビルド・デプロイ設定 (Vercel/Netlify)
- [ ] API統合テスト (Frontend側)

#### Backend担当範囲 (backend/)
- [ ] Firebase プロジェクト設定・管理
- [ ] RESTful API設計・実装 (Express/Fastify)
- [ ] Firestore データベース設計・Repository実装
- [ ] Firebase Auth サーバー側検証
- [ ] Firestore Security Rules実装・管理
- [ ] Firebase Storage設定・ファイル管理API
- [ ] Firebase Functions デプロイ設定
- [ ] API監視・ログ管理・運用

#### 共通責任範囲 (モノレポ)
- [ ] API Contract型定義 (shared/types/)
- [ ] 統合テスト・E2E テスト
- [ ] モノレポ設定・ビルドスクリプト
- [ ] 仕様書管理 (specs/)
- [ ] セキュリティ設計・レビュー

### レビュー規約 (モノレポ対応)

#### スコープ別レビュー責任
- **frontend/ 変更**: Frontend担当者が主レビュー、Backend担当者が副レビュー
- **backend/ 変更**: Backend担当者が主レビュー、Frontend担当者が副レビュー
- **shared/ 変更**: Frontend・Backend双方が必須レビュー
- **specs/ 変更**: Frontend・Backend双方が必須レビュー
- **API Contract変更**: Frontend・Backend双方が必須レビュー

#### 機能別レビュー要件
- **認証・セキュリティ**: Backend担当者が必須レビュー + セキュリティチェックリスト
- **API エンドポイント**: API設計チェックリスト + パフォーマンステスト
- **Database Schema**: データ整合性チェック + マイグレーション検証
- **UI/UX変更**: デザインレビュー + アクセシビリティチェック

#### レビューチェックリスト
```markdown
## API変更レビューチェックリスト
- [ ] API Contract (Request/Response)型定義更新
- [ ] OpenAPI仕様書更新 (必要時)
- [ ] Backend実装との整合性確認
- [ ] Frontend API Client更新
- [ ] 既存APIとの後方互換性確認
- [ ] エラーハンドリング実装
- [ ] セキュリティ要件 (認証・認可) 確認
- [ ] パフォーマンステスト実行
- [ ] 統合テスト更新

## Security変更レビューチェックリスト
- [ ] Firestore Security Rules更新
- [ ] Firebase Storage Rules更新
- [ ] 認証フロー検証
- [ ] Family境界チェック実装
- [ ] 入力バリデーション実装
- [ ] ログ出力にSecret情報含まないことを確認
- [ ] HTTPS/TLS設定確認
```

## パフォーマンス・品質管理 (モノレポ対応)

### Frontend品質管理指標
- **TypeScript**: strict mode有効、型エラー0件
- **テストカバレッジ**: 80%以上維持 (既存レベル継続)
- **ESLint/Prettier**: エラー0件、コードフォーマット統一
- **Bundle Size**: 既存サイズから20%以内の増加
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Accessibility**: WCAG 2.1 AA準拠

### Backend品質管理指標
- **TypeScript**: strict mode有効、型エラー0件
- **テストカバレッジ**: 90%以上 (API・Repository層)
- **API Response Time**: 95%tile < 200ms
- **Firestore Query Performance**: 複雑クエリ < 500ms
- **Memory Usage**: Cold Start < 1GB, Warm < 512MB
- **Error Rate**: < 0.1% (5xx errors)

### API品質管理指標
- **API Contract**: OpenAPI仕様書100%同期
- **API Documentation**: 全エンドポイント仕様書化
- **API Testing**: 統合テストカバレッジ100%
- **Rate Limiting**: 適切な制限値設定・監視
- **Security**: 全エンドポイント認証・認可実装

### モノレポCI/CD品質ゲート
```yaml
# .github/workflows/quality-check.yml
name: Quality Check

jobs:
  frontend-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Frontend Type Check
        run: cd frontend && npm run type-check
      - name: Frontend Lint
        run: cd frontend && npm run lint
      - name: Frontend Test
        run: cd frontend && npm run test:coverage
      - name: Frontend Build
        run: cd frontend && npm run build

  backend-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Backend Type Check
        run: cd backend/functions && npm run type-check
      - name: Backend Lint
        run: cd backend/functions && npm run lint
      - name: Backend Test
        run: cd backend/functions && npm run test:coverage
      - name: Backend Build
        run: cd backend/functions && npm run build

  integration-test:
    needs: [frontend-quality, backend-quality]
    runs-on: ubuntu-latest
    steps:
      - name: Start Firebase Emulators
        run: cd backend && firebase emulators:start --detach
      - name: Run Integration Tests
        run: npm run test:integration
      - name: Run E2E Tests
        run: npm run test:e2e
```

### 継続的改善プロセス
- [ ] 週次: 品質指標ダッシュボード確認・アラート対応
- [ ] 月次: コードレビュー品質・テストカバレッジ分析
- [ ] 四半期: アーキテクチャレビュー・技術的負債棚卸し
- [ ] 半期: API設計・パフォーマンス最適化評価
- [ ] 年次: 技術スタック評価・モノレポ構成見直し

#### 品質監視ツール
- **Frontend**: Lighthouse CI, Bundle Analyzer, Sentry
- **Backend**: Firebase Performance Monitoring, Cloud Logging
- **API**: Postman Monitoring, API Analytics
- **モノレポ**: Dependency Graph Analysis, Security Audit