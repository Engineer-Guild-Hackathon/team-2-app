# specs/02_REQUIREMENTS.md (機能要件・非機能要件)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ 責任分担と要件定義

## 機能要件

### モノレポ責任分担

#### Frontend担当範囲
- [ ] UI/UXコンポーネント設計・実装
- [ ] ユーザーインタラクション管理
- [ ] ローカルキャッシュ (Dexie) 管理
- [ ] API Client実装・エラーハンドリング
- [ ] 認証状態管理・トークン管理
- [ ] オフライン対応・同期状態表示

#### Backend担当範囲
- [ ] RESTful API設計・実装
- [ ] Firestore データベース設計・操作
- [ ] Firebase Auth認証・認可
- [ ] Firebase Storage ファイル管理
- [ ] ビジネスロジック実装
- [ ] セキュリティルール・監視

### Family管理 (REQ-FAM)

#### REQ-FAM-001: Family作成
**Frontend担当**:
- [ ] Family作成UI実装
- [ ] 作成後のFamily情報表示
- [ ] エラーハンドリング・バリデーション

**Backend担当**:
- [ ] POST /api/families エンドポイント実装
- [ ] Firestore FamilyDocument作成
- [ ] 初期ストレージ容量設定 (1GB)
- [ ] 認証ユーザーとFamily紐づけ

**受入条件**:
- [ ] Firebase Auth認証後のFamily作成
- [ ] Family作成時の初期設定自動適用
- [ ] Family ID の UUID v4生成・一意性保証

#### REQ-FAM-002: Familyストレージ管理
**Frontend担当**:
- [ ] ストレージ使用量表示UI
- [ ] 容量警告・制限通知表示
- [ ] ファイルアップロード進捗表示

**Backend担当**:
- [ ] GET /api/families/:id/storage エンドポイント
- [ ] ファイルアップロード時の容量チェック
- [ ] ストレージ使用量の自動更新
- [ ] 容量超過時のアップロード拒否API

**受入条件**:
- [ ] 使用量80%到達時の警告表示
- [ ] 使用量100%到達時のアップロード拒否
- [ ] リアルタイムな使用量更新

### Member管理 (REQ-MEM)

#### REQ-MEM-001: Member登録
**Frontend担当**:
- [ ] Member登録フォームUI
- [ ] ロール選択 (child/parent)
- [ ] 基本情報入力・バリデーション
- [ ] 招待コード表示・共有機能

**Backend担当**:
- [ ] POST /api/families/:familyId/members エンドポイント
- [ ] Firebase Auth UID との紐づけ
- [ ] Member招待コード生成・管理
- [ ] Member権限設定・Firestore書き込み

**受入条件**:
- [ ] Firebase Auth認証との連携
- [ ] Family境界内でのMember管理
- [ ] 招待コードによるFamily参加機能

#### REQ-MEM-002: 権限制御
**Frontend担当**:
- [ ] ログインユーザーの権限状態表示
- [ ] 権限に応じたUI表示制御
- [ ] 権限エラー時の適切な通知

**Backend担当**:
- [ ] JWT認証ミドルウェア実装
- [ ] Family境界チェック実装
- [ ] ロールベースアクセス制御
- [ ] Firestore Security Rules実装

**受入条件**:
- [ ] Child: 自分のTask・Evidenceのみアクセス
- [ ] Parent: Family内全データアクセス
- [ ] 他Family・他ChildデータアクセスAPI拒否

### Task管理 (REQ-TSK)

#### REQ-TSK-001: Task作成・編集 (既存UI維持)
**Frontend担当**:
- [ ] 既存Task作成・編集UIの維持
- [ ] Task種別選択 (test/homework/inquiry/life)
- [ ] ステータス遷移UI (todo→doing→done→done_with_evidence)
- [ ] 進捗率スライダー・期限設定

**Backend担当**:
- [ ] POST /api/families/:familyId/tasks エンドポイント
- [ ] PUT /api/families/:familyId/tasks/:taskId エンドポイント
- [ ] Task作成・更新のビジネスロジック
- [ ] 担当者・Family境界チェック

**受入条件**:
- [ ] 既存frontend/のTask機能100%互換
- [ ] タスク種別・ステータスの厳密型チェック
- [ ] 進捗率0-100%の範囲制限

#### REQ-TSK-002: Task一覧・検索
**Frontend担当**:
- [ ] Task一覧表示UI (既存維持)
- [ ] ステータス・担当者フィルタ
- [ ] リアルタイム更新表示

**Backend担当**:
- [ ] GET /api/families/:familyId/tasks エンドポイント
- [ ] クエリパラメータによるフィルタリング
- [ ] ページネーション実装
- [ ] Task検索・ソート機能

**受入条件**:
- [ ] 1000件のTaskで3秒以内表示
- [ ] リアルタイム同期による即座な更新
- [ ] オフライン時のDexieキャッシュフォールバック

### Evidence管理 (REQ-EVD)

#### REQ-EVD-001: Evidence記録 (既存UI維持)
**Frontend担当**:
- [ ] 既存Evidence記録UIの維持
- [ ] 写真撮影・音声録音・テキスト入力
- [ ] 非認知能力タグ選択
- [ ] ファイルアップロード進捗表示

**Backend担当**:
- [ ] POST /api/families/:familyId/evidence エンドポイント
- [ ] POST /api/families/:familyId/evidence/:evidenceId/file エンドポイント
- [ ] Firebase Storage連携実装
- [ ] ファイル形式・サイズ制限チェック

**受入条件**:
- [ ] 既存frontend/のEvidence機能100%互換
- [ ] 50MB以下ファイルアップロード対応
- [ ] Evidence作成後の不変性保証

#### REQ-EVD-002: Evidence一覧・表示
**Frontend担当**:
- [ ] Evidence一覧・詳細表示UI
- [ ] メディアファイル再生機能
- [ ] タグ・期間フィルタ

**Backend担当**:
- [ ] GET /api/families/:familyId/evidence エンドポイント
- [ ] Firebase Storage署名付きURL生成
- [ ] Evidence検索・フィルタリング
- [ ] メディアファイル配信最適化

**受入条件**:
- [ ] 高速Evidence一覧表示 (1000件で3秒以内)
- [ ] メディアファイルの適切な配信・キャッシュ
- [ ] タグ・関連Taskフィルタリング機能

### Recommendation管理 (REQ-REC)

#### REQ-REC-001: Recommendation作成・管理
**Frontend担当**:
- [ ] Recommendation作成・編集UI
- [ ] 推奨種別選択 (question/book/place)
- [ ] 対象Child選択・推奨理由入力

**Backend担当**:
- [ ] POST /api/families/:familyId/recommendations エンドポイント
- [ ] GET /api/families/:familyId/recommendations エンドポイント
- [ ] Parent権限チェック (作成権限)
- [ ] 対象Member存在チェック

**受入条件**:
- [ ] Parent権限でのRecommendation作成・管理
- [ ] 対象Childへの適切なRecommendation表示
- [ ] 推奨理由・種別の適切な管理

## 非機能要件 (NFR)

### パフォーマンス要件

#### NFR-PERF-001: API応答時間
**Frontend要件**:
- [ ] UI操作レスポンス < 200ms
- [ ] ページ遷移 < 500ms
- [ ] 大量データ表示 < 3秒 (1000件)

**Backend要件**:
- [ ] API応答時間 < 200ms (95パーセンタイル)
- [ ] Firestore クエリ最適化
- [ ] 並行処理・キャッシュ活用

#### NFR-PERF-002: ファイル処理
**Frontend要件**:
- [ ] ファイルアップロード進捗表示
- [ ] 大容量ファイル非同期処理
- [ ] アップロード失敗時の自動リトライ

**Backend要件**:
- [ ] 50MB以下ファイル処理
- [ ] Firebase Storage並行アップロード
- [ ] アップロード完了通知

### 可用性要件

#### NFR-AVAIL-001: オフライン対応
**Frontend担当**:
- [ ] Dexieキャッシュによるオフライン継続利用
- [ ] オンライン復帰時の自動同期
- [ ] 同期状態の適切なUI表示

**Backend担当**:
- [ ] Firebase高可用性構成活用
- [ ] API冗長化・フェイルオーバー
- [ ] データ整合性保証

#### NFR-AVAIL-002: 可用性目標
- [ ] サービス可用性 99.9%以上
- [ ] 計画停止時間 月4時間以内
- [ ] 障害復旧時間 1時間以内

### セキュリティ要件

#### NFR-SEC-001: 認証・認可
**Frontend担当**:
- [ ] Firebase Auth Token安全管理
- [ ] 認証状態の適切な管理・更新
- [ ] セキュリティエラー適切表示

**Backend担当**:
- [ ] 全APIエンドポイント認証必須
- [ ] JWT Token検証・有効期限管理
- [ ] Family境界セキュリティ厳格実装

#### NFR-SEC-002: データ保護
**Frontend担当**:
- [ ] 機密情報ローカルストレージ暗号化
- [ ] XSS・CSRF対策実装
- [ ] 安全なAPI通信実装

**Backend担当**:
- [ ] Firestore Security Rules厳格実装
- [ ] データ暗号化 (保存時・転送時)
- [ ] アクセスログ・監視実装

### スケーラビリティ要件

#### NFR-SCALE-001: ユーザー数
- [ ] 同時接続ユーザー 1,000人対応
- [ ] Family数 10,000 Family対応
- [ ] 1 Family当たり Member 50人上限

#### NFR-SCALE-002: データ量
- [ ] 1 Family当たり Task 10,000件対応
- [ ] 1 Child当たり Evidence 5,000件対応
- [ ] ストレージ 1GB/Family 上限

### 運用・保守要件

#### NFR-OPS-001: 監視・ログ
**Frontend担当**:
- [ ] エラー追跡・レポート機能
- [ ] ユーザー行動分析実装
- [ ] パフォーマンス監視

**Backend担当**:
- [ ] API監視・アラート設定
- [ ] Firestore使用量監視
- [ ] セキュリティログ記録・分析

#### NFR-OPS-002: バックアップ・復旧
**Backend担当**:
- [ ] Firestore自動バックアップ設定
- [ ] Firebase Storage冗長化
- [ ] 災害復旧手順整備・テスト

## 制約事項

### 技術制約
- [ ] Frontend: React 18+ TypeScript 5+ 必須
- [ ] Backend: Firebase Functions Node.js 18+ 必須
- [ ] Database: Firestore のみ使用
- [ ] 認証: Firebase Auth のみ使用

### ビジネス制約
- [ ] Family境界を超えたデータアクセス禁止
- [ ] Child権限でのParent機能アクセス禁止
- [ ] Evidence作成後の変更・削除制限

### 運用制約
- [ ] ストレージ使用量 1GB/Family 上限
- [ ] ファイルサイズ 50MB/file 上限
- [ ] API呼び出し回数制限 1000req/min/user