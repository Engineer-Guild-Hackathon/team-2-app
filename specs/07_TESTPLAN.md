# specs/07_TESTPLAN.md (テスト戦略・計画)

> バージョン: v0.2 (2025-09-18 JST)
> 分離アーキテクチャのテスト戦略・計画

## テスト戦略概要

`08_ARCH.md`で定義されたFrontend/Backend分離アーキテクチャに基づき、それぞれの責務に合わせたテスト戦略を定義する。

### テスト方針
- **責務の分離**: FrontendはUIとAPIクライアントの振る舞い、BackendはAPIとビジネスロジックの正当性に責任を持つ。
- **自動化優先**: CI/CDでの自動実行を前提とし、手動テストを最小化する。
- **品質ゲート**: 各PRでカバレッジとテスト成功を必須条件とする。

---

## Frontend テスト計画

Frontendのテストは、UIコンポーネントの表示とインタラクション、およびBackend APIとの適切な連携（モックを使用）に焦点を当てる。

### Frontend テストピラミッド
- **単体テスト (60%)**: 個別のReactコンポーネント、Hooks、ヘルパー関数。
- **結合テスト (30%)**: 複数のコンポーネントを組み合わせ、APIをモックしたシナリオテスト。
- **E2Eテスト (10%)**: 主要なユーザーシナリオを実際のブラウザでテスト。

### 単体テスト (Unit Tests)
- **ツール**: Vitest, React Testing Library
- **対象**: UIコンポーネント、Hooks、`usecase`層のロジック。
- **方針**: `usecase`層のテストでは、APIクライアントをモックし、正しいリクエストが生成されることを検証する。

```typescript
// frontend/src/usecase/taskService.test.ts
describe('TaskService', () => {
  let mockApiClient: jest.Mocked<ApiClient>;
  let taskService: TaskService;

  beforeEach(() => {
    mockApiClient = { get: jest.fn(), post: jest.fn() };
    taskService = new TaskService(mockApiClient);
  });

  it('addTaskは、正しいエンドポイントとデータでAPIクライアントを呼び出す', async () => {
    const taskData = { title: 'Test' };
    await taskService.addTask('family1', taskData);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/families/family1/tasks',
      taskData
    );
  });
});
```

### 結合テスト (Integration Tests)
- **ツール**: Vitest, React Testing Library, MSW (Mock Service Worker)
- **対象**: 複数のコンポーネントが連携する機能（タスク一覧表示、作成フォームなど）。
- **方針**: MSWを使い、実際のHTTPリクエストレベルでAPIをモックする。これにより、より現実に近い環境でコンポーネント間の連携をテストする。

```typescript
// frontend/src/components/features/TaskList.integration.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/families/:familyId/tasks', (req, res, ctx) => {
    return res(ctx.json({ tasks: [{ task_id: '1', title: 'Mock Task' }] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TaskList Integration', () => {
  it('APIから取得したタスクを正しく表示する', async () => {
    render(<TaskList />);
    expect(await screen.findByText('Mock Task')).toBeInTheDocument();
  });
});
```

### E2Eテスト (End-to-End Tests)
- **ツール**: Playwright または Cypress
- **対象**: `06_ACCEPTANCE.md`で定義された主要なユーザーストーリー。
- **方針**: 実際にBackendサーバー（開発環境またはステージング環境）と通信させ、ユーザーの操作から結果表示までを一気通貫でテストする。

---

## Backend テスト計画

Backendのテストは、APIエンドポイントが仕様通りに動作すること、ビジネスロジックが正しいこと、データベースとの連携が確実であることに焦点を当てる。

### Backend テストピラミッド
- **単体テスト (50%)**: UseCase、Repository、ドメインエンティティのロジック。
- **結合テスト (40%)**: APIエンドポイントのテスト（DB Emulator連携）。
- **負荷テスト (10%)**: 主要APIのパフォーマンステスト。

### 単体テスト (Unit Tests)
- **ツール**: Jest
- **対象**: UseCase層、Repository層のメソッド。
- **方針**: 依存関係（他Repository、DBクライアント）はモックし、ビジネスロジック単体の正しさを検証する。

```typescript
// backend/src/usecases/taskUseCase.test.ts
describe('TaskUseCase', () => {
  let mockTaskRepo: jest.Mocked<TaskRepository>;
  let taskUseCase: TaskUseCase;

  beforeEach(() => {
    mockTaskRepo = { create: jest.fn() };
    taskUseCase = new TaskUseCase(mockTaskRepo);
  });

  it('createTaskは、Taskエンティティを作成し、リポジトリを呼び出す', async () => {
    await taskUseCase.createTask('family1', { title: 'Test' });
    expect(mockTaskRepo.create).toHaveBeenCalled();
  });
});
```

### 結合テスト (Integration Tests)
- **ツール**: Jest, Supertest
- **対象**: Express/FastifyのAPIエンドポイント。
- **方針**: Firebase Emulatorを起動した状態で、APIにHTTPリクエストを送信し、レスポンスとDBの状態を検証する。

```typescript
// backend/src/routes/tasks.integration.test.ts
import request from 'supertest';
import { app } from '../app'; // Express app

describe('POST /api/families/:familyId/tasks', () => {
  it('有効なリクエストでタスクを作成し、201を返す', async () => {
    const response = await request(app)
      .post('/api/families/family1/tasks')
      .set('Authorization', 'Bearer valid-token') // 認証はモックまたはテスト用トークン
      .send({ title: 'New Task' });

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe('New Task');

    // EmulatorのDBを直接確認して、データが作成されたことも検証
  });
});
```

## CI/CD 統合

GitHub Actionsで、FrontendとBackendのテストジョブを分離して実行する。

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd frontend && npm ci && npm test

  backend-test:
    runs-on: ubuntu-latest
    services:
      firestore-emulator:
        image: gcr.io/google.com/cloudsdktool/cloud-sdk:emulators
        ports: ['8080:8080']
        options: --user=root
        args: gcloud beta emulators firestore start --host-port=0.0.0.0:8080
    steps:
      - uses: actions/checkout@v3
      - run: cd backend && npm ci && npm test
```

## 品質管理

- **カバレッジ目標**: Frontend, Backendともに単体テストで85%以上。
- **品質ゲート**: PR時にすべてのテストが成功すること。カバレッジが低下しないこと。
- **レビュー**: すべてのコードは、テストコードを含めて2人以上によるレビューを必須とする。
