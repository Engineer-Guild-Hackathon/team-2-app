# specs/00_CONTEXT.md (背景と目的)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ 分離デプロイアーキテクチャ

## プロジェクト概要

### アプリケーション名
**ほめログ (homelog)**

### 一言ミッション
こどもの **行動・努力の可視化** → **親との対話創出** → **親子双方の自己効力感の向上**

## 背景と目的

### 解決したい課題
- こどもの学習・生活の努力が見えにくい
- 親子の対話のきっかけが不足
- こどもの自己効力感の向上機会が限定的

### 目標
- **Task(タスク)管理** + **Evidence(証拠)記録** による行動の可視化
- 家族内での記録共有による対話促進
- リアルタイム同期によるマルチデバイス対応

## 対象ユーザーと権限

### Primary Users
- **Child(子)**: タスクの実行、証拠の記録・投稿
- **Parent(親)**: 家族管理、全記録の閲覧・管理

### User Roles
```typescript
type Role = 'child' | 'parent';
```

### 権限設計
- **Child**: 自分のTask・Evidenceの作成・閲覧
- **Parent**: Family内の全データの閲覧・管理・設定変更

## アーキテクチャ概要

### モノレポ構成
```
team-2-app/
├── frontend/           # React フロントエンドアプリケーション
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/            # Firebase バックエンドAPI
│   ├── functions/      # Firebase Functions
│   ├── firestore.rules # Firestore Security Rules
│   ├── storage.rules   # Firebase Storage Rules
│   └── ...
└── specs/              # 共通仕様書
```

### 分離デプロイ戦略
- **frontend/**: Vercel/Netlify等へ独立デプロイ
- **backend/**: Firebase Hosting + Functions へ独立デプロイ
- **メリット**: 独立スケーリング、技術選択の自由度、責任境界の明確化

## 技術スタック

### Frontend (frontend/)
- **フレームワーク**: React + TypeScript + Tailwind CSS
- **ビルド**: Vite
- **テスト**: Vitest
- **データ**: Dexie (IndexedDB) ローカルキャッシュ
- **HTTP Client**: fetch/axios (API通信)

### Backend (backend/)
- **インフラ**: Firebase (Firestore + Functions + Storage + Auth)
- **API**: Firebase Functions (Express/Fastify)
- **データベース**: Firestore
- **認証**: Firebase Auth
- **ファイル**: Firebase Storage
- **セキュリティ**: Firestore Security Rules

### 通信プロトコル
- **REST API**: HTTP/HTTPS
- **リアルタイム**: WebSocket/Server-Sent Events
- **認証**: JWT (Firebase Auth Token)

## 現在の実装状況

### Frontend (frontend/) - 完全実装済み
- [x] Domain層 (entities, valueObjects, repositories, services)
- [x] UseCase層 (taskService, evidenceService, memberService等)
- [x] Infrastructure層 (Dexie実装済み)
- [x] UI Component層 (React実装済み)
- [x] テストコード (Vitest)
- [x] Task管理UI (作成・更新・完了)
- [x] Evidence記録UI (写真・音声・テキスト)
- [x] Family内データ表示・管理

### Backend (backend/) - 新規構築予定
- [ ] Firebase プロジェクト設定
- [ ] Firebase Functions API実装
- [ ] Firestore データベース設計・実装
- [ ] Firebase Auth認証設定
- [ ] Firestore Security Rules実装
- [ ] Firebase Storage設定
- [ ] API エンドポイント設計・実装

## データフロー設計

### 現在 (frontend/のみ)
```
UI Components → UseCase Services → Dexie Repository → IndexedDB
```

### 目標 (frontend/ + backend/)
```
Frontend:
UI Components → UseCase Services → API Client → HTTP Request
                               ↘ Dexie Repository → IndexedDB (Cache)

Backend:
HTTP Request → API Routes → Business Logic → Firestore Repository → Firestore
                                         → Firebase Storage (Files)
```

## スコープ定義

### MVP範囲 (Phase 1)

#### Frontend担当 (API統合)
- [ ] API Client実装 (fetch/axios)
- [ ] Backend API連携
- [ ] Firebase Auth Token統合
- [ ] エラーハンドリング・リトライ機能
- [ ] オフライン対応 (Dexieフォールバック)

#### Backend担当 (新規構築)
- [ ] Firebase プロジェクト・Functions環境構築
- [ ] RESTful API設計・実装
- [ ] Authentication middleware実装
- [ ] Task・Evidence・Member API実装
- [ ] ファイルアップロード API実装
- [ ] Firestore Security Rules実装

### 将来拡張 (Phase 2+)

#### Frontend担当
- [ ] リアルタイム更新 (WebSocket/SSE)
- [ ] 分析・レポート画面
- [ ] プッシュ通知UI
- [ ] 多Family間連携UI

#### Backend担当
- [ ] WebSocket/SSE リアルタイム通信
- [ ] 分析・レポート API
- [ ] 通知・リマインダーシステム
- [ ] AI Recommendation API
- [ ] 多Family間連携機能

## 仕様書構成

本仕様書 (`/specs/*.md`) は以下の構成で管理:

1. **00_CONTEXT.md** (本書): 背景・目的・全体像
2. **01_DOMAIN.md**: ドメインモデル・エンティティ定義
3. **02_REQUIREMENTS.md**: 機能要件・非機能要件
4. **03_USECASES.md**: ユースケース定義
5. **04_API.md**: Firestore設計・API仕様
6. **05_SCHEMAS.md**: データスキーマ定義
7. **06_ACCEPTANCE.md**: 受入条件・テスト観点
8. **07_TESTPLAN.md**: テスト戦略・計画
9. **08_ARCH.md**: アーキテクチャ詳細設計
10. **09_GUIDELINES.md**: 開発ガイドライン
11. **10_GUARDS.md**: セキュリティ・制約事項
12. **11_TODO_PLAN.md**: 実装計画・マイルストーン
13. **12_TODO_GUIDELINES.md**: TODO管理運用
14. **13_CONTRIB_RULES.md**: コントリビューション規約

## 変更管理方針

### SSOT (Single Source of Truth)
- 仕様変更は **必ず `/specs/*.md` → 実装** の順で反映
- 実装で仕様と差異が発見された場合は `/specs` を先に更新

### トレーサビリティ
- すべての実装・PR・コミットに `REQ/UC/NFR/ACC/TODO` ID を紐づけ
- 仕様→実装の追跡可能性を確保