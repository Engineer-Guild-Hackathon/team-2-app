# specs/11_TODO_PLAN.md (実装計画・マイルストーン)

> バージョン: v0.2 (2025-09-18 JST)
> Frontend/Backend分離アーキテクチャ実装計画

## 実装計画概要

`08_ARCH.md`で定義された分離アーキテクチャに基づき、実装タスクを計画する。FrontendはBackend APIの利用者、BackendはAPIの提供者としての役割を明確にする。

### 実装方針
- **API Contract Driven**: `05_SCHEMAS.md`で定義されたAPIスキーマをI/Fの正とする。
- **並行開発**: Frontend/Backend担当者による効率的協働。
- **段階的移行**: 既存のFrontend UIを活かしつつ、データ層をAPI連携に切り替える。

## フェーズ構成

### Phase 0: 準備・基盤整備 (1週間)
**期間**: 2025-09-18 〜 2025-09-25

#### Frontend担当
- [ ] 既存frontend/コードの品質確認・リファクタリング
- [ ] Firebase Auth SDKの追加・設定
- [ ] APIクライアントの雛形実装 (`src/infrastructure/api/httpClient.ts`)
- [ ] 環境変数設定 (`.env`ファイルでBackend APIのURLを管理)
- [ ] 既存テストの実行確認

#### Backend担当
- [ ] Firebaseプロジェクト作成 (Auth, Firestore, Storage)
- [ ] `backend/`プロジェクトセットアップ (Node.js, TypeScript, Expressなど)
- [ ] APIサーバーの雛形実装 (Expressアプリの起動、ルーティング設定)
- [ ] Firebase Admin SDKの追加・設定
- [ ] 開発環境セットアップ (Firebase Emulator Suite連携)

#### 完了条件
- [ ] FrontendからBackendのヘルスチェックAPIを呼び出し、疎通確認が取れる。
- [ ] BackendがFirebase Emulatorに接続できる。

### Phase 1: 認証・Member管理 (2週間)
**期間**: 2025-09-25 〜 2025-10-09

#### Frontend担当
- [ ] Firebase Auth SDKによる認証フロー実装 (ログイン/ログアウト)
- [ ] 取得したIDトークンをAPIクライアントに設定する処理を実装
- [ ] Member管理画面をBackend API連携に修正
  - [ ] `GET /api/families/{familyId}/members` でメンバー一覧表示
  - [ ] `POST /api/families/{familyId}/members` でメンバー追加
- [ ] 認証関連のテストを実装

#### Backend担当
- [ ] 認証ミドルウェア実装 (IDトークン検証)
- [ ] Member管理APIの実装 (`/api/families/{familyId}/members`)
  - [ ] `GET`, `POST` エンドポイントの作成
  - [ ] UseCase, Repository レイヤーの実装 (Member作成・取得ロジック)
- [ ] Firestore Security Rulesの初期設定 (認証済みユーザーのみアクセス許可など)
- [ ] APIの単体・結合テストを実装

#### 完了条件
- [ ] Frontendでログイン後、API経由でメンバー一覧を取得・表示できる。
- [ ] Frontendから新しいメンバーを追加できる。

### Phase 2: Family管理・基本同期 (2週間)
**期間**: 2025-10-09 〜 2025-10-23

#### Frontend担当
- [ ] Family作成・参加機能をBackend API連携に修正
  - [ ] `POST /api/families` でFamily作成
  - [ ] `POST /api/families/join` でFamilyに参加
- [ ] オフラインキューイング機構の実装 (`src/infrastructure/sync/`)
- [ ] ローカルキャッシュ(Dexie)とAPI連携のハイブリッド構成を確立

#### Backend担当
- [ ] Family管理APIの実装
  - [ ] `POST /api/families` (Family作成)
  - [ ] `POST /api/families/join` (メンバーコードでの参加)
- [ ] Family境界をチェックする認可ロジックをAPIに実装
- [ ] APIのテストを拡充

#### 完了条件
- [ ] 新規ユーザーがFamilyを作成、または既存のFamilyに参加できる。
- [ ] オフライン時の操作がキューに保存され、オンライン復帰時に同期される。

### Phase 3: Task管理統合 (2週間)
**期間**: 2025-10-23 〜 2025-11-06

#### Frontend担当
- [ ] 既存Task管理機能をBackend API連携に完全移行
  - [ ] `usecase/taskService.ts` をAPIクライアント呼び出しに修正
  - [ ] `GET`, `POST`, `PATCH`, `DELETE` に対応
- [ ] オフラインキューを使ったTask操作の同期を実装
- [ ] Task関連UIのリアルタイム更新をAPIレスポンスベースに修正

#### Backend担当
- [ ] Task管理API (`/api/families/{familyId}/tasks`) の完全実装
  - [ ] `GET` (一覧, 詳細), `POST`, `PATCH`, `DELETE` エンドポイント作成
  - [ ] UseCase, Repository レイヤーの実装
- [ ] Firestoreインデックスの最適化
- [ ] APIのテストを拡充

#### 完了条件
- [ ] TaskのCRUD操作がAPI経由で正常に動作する。
- [ ] オフラインでのTask操作がオンライン復帰時に同期される。

### Phase 4: Evidence管理・Storage統合 (3週間)
**期間**: 2025-11-06 〜 2025-11-27

#### Frontend担当
- [ ] Evidence投稿機能をBackend API連携に移行
  - [ ] テキスト証拠 (`POST /evidence`)
  - [ ] ファイル証拠 (メタデータ送信 → 署名付きURLへアップロード)
- [ ] 署名付きURLへのファイルアップロード処理を実装
- [ ] Evidence一覧表示をAPI連携に修正

#### Backend担当
- [ ] Evidence管理API (`/api/families/{familyId}/evidence`) の実装
  - [ ] テキスト証拠の作成
  - [ ] ファイルアップロード用の署名付きURL生成
  - [ ] Evidence一覧取得
- [ ] Firebase StorageのSecurity Rulesを設定
- [ ] ストレージ使用量の集計・制限ロジックを実装

#### 完了条件
- [ ] テキストおよびファイルの証拠が投稿・表示できる。
- [ ] ストレージ使用量制限が機能する。

### Phase 5: Recommendation・最適化 (2週間)
**期間**: 2025-11-27 〜 2025-12-11

#### Frontend担当
- [ ] Recommendation機能をBackend API連携に修正
- [ ] 全体的なパフォーマンス最適化 (バンドルサイズ、レンダリング)
- [ ] エラーハンドリングとUI/UXの改善

#### Backend担当
- [ ] Recommendation管理APIの実装
- [ ] API全体のパフォーマンス最適化 (クエリ、キャッシュ戦略)
- [ ] ログ収集・監視設定

#### 完了条件
- [ ] 全機能がAPI経由で動作する。
- [ ] パフォーマンスが目標値を達成する。

### Phase 6: 本番化・運用準備 (2週間)
**期間**: 2025-12-11 〜 2025-12-25

#### Frontend担当
- [ ] 本番環境向けビルド・設定
- [ ] Vercel/Netlifyなどへの自動デプロイ設定
- [ ] エラーレポート・分析ツールの導入

#### Backend担当
- [ ] 本番Firebase設定・セキュリティ強化
- [ ] Cloud Functions/Cloud Runへの自動デプロイ設定
- [ ] 本番環境の監視・アラート設定
- [ ] バックアップ・災害復旧計画の策定

#### 完了条件
- [ ] CI/CDパイプラインが構築され、自動デプロイが可能になる。
- [ ] 本番環境が安定稼働し、監視体制が整う。
