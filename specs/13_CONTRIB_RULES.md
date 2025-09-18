# specs/13_CONTRIB_RULES.md (コントリビューションルール)

> バージョン: v0.1 (2025-09-17 JST)
> frontend/実装 + Firestore統合のコントリビューション・貢献ルール定義

## コントリビューションルール概要

このドキュメントは [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md) を基盤として、frontend/実装とFirestore統合における追加のコントリビューションルールを定義します。

### 基本方針
- **既存ルール継承**: .github/CONTRIBUTING.md の全ルールを継承
- **技術特化**: Frontend/Backend開発に特化したルール追加
- **品質保証**: セキュリティ・パフォーマンス・テスト要件の明確化
- **チーム協働**: Frontend/Backend担当者間の効率的協働支援

## Frontend開発コントリビューションルール

### Frontend特化コーディング規約

#### TypeScript型安全性要件
```typescript
// 必須: strictモード有効
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// 必須: 型定義完全性
interface Task {
  taskId: string;        // UUID v4必須
  familyUid: string;     // 必須
  assigneeMemberId: string; // 必須
  title: string;         // max: 200文字
  type: 'test' | 'homework' | 'inquiry' | 'life'; // 厳密型
  status: 'todo' | 'doing' | 'done' | 'done_with_evidence'; // 厳密型
  progress: number;      // 0-100の範囲
  due?: string;          // ISO 8601形式
  createdAt: number;     // Unix timestamp
  updatedAt: number;     // Unix timestamp
}
```

#### React Component規約
```typescript
// 必須: 関数コンポーネント + TypeScript
interface Props {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onUpdate }) => {
  // 必須: useCallback for handlers
  const handleUpdate = useCallback((newTask: Task) => {
    onUpdate(newTask);
  }, [onUpdate]);

  // 必須: エラーバウンダリー考慮
  return (
    <ErrorBoundary fallback={<TaskCardError />}>
      {/* Component implementation */}
    </ErrorBoundary>
  );
};
```

#### Firestore統合規約
```typescript
// 必須: Repository Pattern実装
export class FirestoreTaskRepository implements TaskRepository {
  constructor(private db: Firestore) {}

  async create(task: Task): Promise<Task> {
    // 必須: バリデーション
    if (!this.validateTask(task)) {
      throw new ValidationError('Invalid task data');
    }

    // 必須: Firestore形式変換
    const firestoreTask = this.toFirestoreFormat(task);

    // 必須: エラーハンドリング
    try {
      await setDoc(doc(this.db, 'families', task.familyUid, 'tasks', task.taskId), firestoreTask);
      return task;
    } catch (error) {
      throw new FirestoreError('Failed to create task', error);
    }
  }
}
```

### Frontend Pull Request要件

#### 必須チェック項目
- [ ] TypeScript型エラー0件
- [ ] ESLint エラー・警告0件
- [ ] Prettier フォーマット適用済み
- [ ] React DevToolsでのメモリリーク確認
- [ ] アクセシビリティ (a11y) 基本チェック
- [ ] モバイル表示確認 (responsive design)
- [ ] 既存テストが全て成功
- [ ] 新機能に対応するテスト追加

#### コードレビュー観点
```markdown
### Frontend Code Review Checklist

#### 機能実装
- [ ] Clean Architecture層分離が適切
- [ ] Repository Pattern正しく実装
- [ ] Error Boundary適切に配置
- [ ] Loading/Error状態適切に処理

#### パフォーマンス
- [ ] 不要な再レンダリング防止 (memo, useMemo, useCallback)
- [ ] 大量データ表示の仮想化実装
- [ ] Bundle size増加が適切範囲内
- [ ] 画像最適化・Lazy loading実装

#### セキュリティ
- [ ] XSS対策実装 (適切なエスケープ)
- [ ] CSRF対策考慮
- [ ] 機密情報のログ出力防止
- [ ] Firebase Auth状態適切に管理
```

## Backend開発コントリビューションルール

### Firebase特化セキュリティ要件

#### Security Rules実装要件
```javascript
// 必須: Family境界の厳格な制御
match /families/{family_id} {
  // 必須: 認証チェック
  allow read, write: if request.auth != null;

  // 必須: Family メンバーシップ検証
  allow read, write: if isFamilyMember(family_id);

  // 必須: ロールベースアクセス制御
  match /tasks/{task_id} {
    allow write: if isParentInFamily(family_id) ||
                    (isChildInFamily(family_id) &&
                     resource.data.assignee_member_id == request.auth.uid);
  }
}
```

#### Firebase設定要件
```typescript
// 必須: 環境分離
const firebaseConfig = {
  development: {
    useEmulators: true,
    firestoreEmulatorHost: 'localhost:8080',
    authEmulatorHost: 'localhost:9099'
  },
  production: {
    useEmulators: false,
    // 本番設定
  }
};

// 必須: エラーハンドリング
export class FirebaseErrorHandler {
  static handle(error: FirebaseError): AppError {
    switch (error.code) {
      case 'permission-denied':
        return new AuthorizationError('Access denied');
      case 'not-found':
        return new NotFoundError('Resource not found');
      default:
        return new InternalError('Unexpected Firebase error');
    }
  }
}
```

### Backend Pull Request要件

#### 必須チェック項目
- [ ] Security Rules構文チェック成功
- [ ] Firebase Emulator Testsuite全て成功
- [ ] パフォーマンステスト (クエリ最適化確認)
- [ ] セキュリティテスト (権限制御確認)
- [ ] データ整合性テスト
- [ ] ログ・監視設定適切

#### セキュリティレビュー観点
```markdown
### Backend Security Review Checklist

#### 認証・認可
- [ ] 全てのエンドポイントで認証必須
- [ ] Family境界でのデータ分離適切
- [ ] ロールベースアクセス制御正確
- [ ] トークン検証・有効期限管理適切

#### データ保護
- [ ] 個人情報適切にマスキング
- [ ] ログに機密情報出力なし
- [ ] データ暗号化適切
- [ ] バックアップ・復旧手順整備

#### 運用セキュリティ
- [ ] 監視・アラート適切設定
- [ ] インシデント対応手順整備
- [ ] セキュリティログ適切記録
- [ ] 定期セキュリティ監査対応
```

## 統合開発ワークフロー

### Frontend/Backend協働プロセス

#### 機能開発フロー
```markdown
### 新機能開発プロセス

1. **設計フェーズ**
   - [ ] Frontend/Backend合同設計ミーティング
   - [ ] API仕様・データ形式合意
   - [ ] セキュリティ要件確認
   - [ ] パフォーマンス要件確認

2. **実装フェーズ**
   - [ ] Backend: Security Rules・API実装
   - [ ] Frontend: UI・統合実装
   - [ ] 並行テスト実装・実行

3. **統合フェーズ**
   - [ ] Firebase Emulator での統合テスト
   - [ ] E2Eテスト実行・確認
   - [ ] パフォーマンステスト・最適化

4. **リリースフェーズ**
   - [ ] 本番環境デプロイテスト
   - [ ] 監視・アラート確認
   - [ ] ドキュメント更新
```

#### ブランチ戦略拡張
```markdown
### プロジェクト特化ブランチ命名

#### Frontend変更
- `feat/frontend/123-add-task-ui` - UI機能追加
- `fix/frontend/456-fix-auth-error` - Frontend バグ修正
- `refactor/frontend/789-optimize-rendering` - Frontend リファクタリング

#### Backend変更
- `feat/backend/234-security-rules` - Security Rules実装
- `fix/backend/567-firestore-query` - Backend バグ修正
- `chore/backend/890-monitoring-setup` - Backend 設定

#### 統合変更
- `feat/integration/345-sync-manager` - Frontend/Backend統合
- `test/e2e/678-user-flow` - E2Eテスト
- `docs/specs/901-update-architecture` - specs/ 更新
```

### コードレビュープロセス拡張

#### レビュー担当分担
```markdown
### Review Assignment Matrix

| 変更種別 | Primary Reviewer | Secondary Reviewer |
|---------|------------------|-------------------|
| Frontend Only | Frontend Lead | Backend担当 (アーキテクチャ確認) |
| Backend Only | Backend Lead | Frontend担当 (API確認) |
| Firebase統合 | Frontend + Backend | セキュリティ担当 (必須) |
| Security Rules | Backend Lead | セキュリティ担当 (必須) |
| E2E Tests | QA担当 | Frontend + Backend |
| specs/ Update | 変更実装者 | プロジェクトリード |
```

#### レビュー基準
```markdown
### Review Approval Criteria

#### Lightweight Review (1 Approval)
- [ ] コードフォーマット修正
- [ ] ドキュメント更新
- [ ] 既存機能への影響なし

#### Standard Review (2 Approvals)
- [ ] 新機能実装
- [ ] バグ修正
- [ ] リファクタリング

#### Critical Review (3+ Approvals)
- [ ] Security Rules変更
- [ ] 認証・認可ロジック変更
- [ ] データスキーマ変更
- [ ] 本番設定変更
```

## 品質保証・テスト要件

### テストカバレッジ要件

#### Frontend テスト要件
```typescript
// 必須: Component Tests
describe('TaskCard', () => {
  it('should render task information correctly', () => {
    // Testing Library推奨
  });

  it('should handle update callbacks', () => {
    // Event handler testing
  });

  it('should display error states appropriately', () => {
    // Error handling testing
  });
});

// 必須: Integration Tests
describe('TaskService Integration', () => {
  it('should sync with Firestore correctly', async () => {
    // Firebase Emulator使用
  });
});
```

#### Backend テスト要件
```typescript
// 必須: Security Rules Tests
describe('Family Security Rules', () => {
  it('should deny access to non-family members', async () => {
    // Firebase Rules Test SDK使用
  });

  it('should allow child to update own tasks only', async () => {
    // 権限制御テスト
  });
});

// 必須: Performance Tests
describe('Query Performance', () => {
  it('should handle 1000+ tasks efficiently', async () => {
    // 大量データ性能テスト
  });
});
```

### パフォーマンス基準

#### Frontend パフォーマンス要件
- [ ] Core Web Vitals 全て Good範囲
- [ ] Bundle size増加 20%以内
- [ ] Initial Load Time < 3秒
- [ ] Task一覧表示 < 500ms (1000件)
- [ ] Evidence表示 < 1秒 (大容量ファイル除く)

#### Backend パフォーマンス要件
- [ ] Firestore クエリレスポンス < 200ms (p95)
- [ ] Firebase Storage アップロード進捗適切表示
- [ ] 同時接続ユーザー 100+ 対応
- [ ] データ同期遅延 < 1秒

## セキュリティ・コンプライアンス要件

### セキュリティコントリビューション要件

#### 必須セキュリティチェック
- [ ] Firebase Security Rules テスト完全通過
- [ ] 個人情報適切マスキング・暗号化
- [ ] 認証トークン適切管理
- [ ] XSS・CSRF対策実装
- [ ] SQL インジェクション対策 (該当時)
- [ ] ファイルアップロード脆弱性対策

#### セキュリティレビュープロセス
```markdown
### Security Review Process

#### Level 1: Code Security Review
- [ ] 静的解析ツール実行・通過
- [ ] セキュリティライブラリ最新版使用
- [ ] 脆弱性スキャン実行・通過

#### Level 2: Penetration Testing
- [ ] 認証バイパステスト
- [ ] 権限エスカレーションテスト
- [ ] データアクセス境界テスト

#### Level 3: Security Audit
- [ ] 外部セキュリティ監査 (重要変更時)
- [ ] コンプライアンス要件確認
- [ ] インシデント対応手順確認
```

## 継続的改善・学習

### ナレッジ共有要件

#### 技術ドキュメント管理
- [ ] 重要な設計判断をspecs/に記録
- [ ] トラブルシューティングガイド更新
- [ ] ベストプラクティス事例集更新
- [ ] セキュリティ知見共有

#### チーム学習プロセス
- [ ] コードレビューでの学習機会提供
- [ ] 技術勉強会・知見共有会開催
- [ ] 外部技術情報・脆弱性情報共有
- [ ] プロジェクト振り返り・改善実施

### 貢献評価・認識

#### 貢献評価基準
- [ ] コード品質・設計への貢献
- [ ] セキュリティ・パフォーマンス向上貢献
- [ ] チーム協働・知識共有貢献
- [ ] ドキュメント・テスト整備貢献
- [ ] 技術的負債解消貢献

#### コントリビューター認識
- [ ] 月次貢献者認識
- [ ] 年次MVP・技術貢献賞
- [ ] オープンソース貢献支援
- [ ] 技術ブログ・登壇機会提供