# specs/12_TODO_GUIDELINES.md (TODO管理ガイドライン)

> バージョン: v0.1 (2025-09-17 JST)
> frontend/実装 + Firestore統合のTODO管理ガイドライン

## TODO管理ガイドライン概要

frontend/実装とFirestore統合における効率的なTODO管理・プロジェクト進行のためのガイドライン

### 管理方針
- **チェックリスト形式**: 絵文字ではなく `- [ ]` / `- [x]` 形式を厳格使用
- **責任分担明確化**: Frontend/Backend担当者別のタスク管理
- **進捗可視化**: リアルタイムでの進捗状況把握
- **品質保証**: 完了条件の明確化とレビュープロセス

## TODO記述規約

### 基本記述ルール

#### チェックボックス形式 (必須)
```markdown
## 正しい記述例
- [ ] 未完了タスク
- [x] 完了済みタスク

## 絶対禁止 (❌)
❌ 🔲 未完了タスク
❌ ✅ 完了済みタスク
❌ 📋 タスクリスト
```

#### タスク記述構造
```markdown
### [機能名] - [担当者]

#### Frontend担当
- [ ] 具体的なファイル実装 (src/path/to/file.ts)
- [ ] テスト実装 (src/test/path/to/test.ts)
- [ ] ドキュメント更新

#### Backend担当
- [ ] Firebase設定・Security Rules実装
- [ ] インデックス・クエリ最適化
- [ ] 監視・ログ設定

#### 完了条件
- [ ] 機能テストが全て成功
- [ ] セキュリティ検証完了
- [ ] パフォーマンス基準達成
```

### タスク分類・優先度

#### タスクカテゴリ
```markdown
- [ ] 🚀 [CRITICAL] システム停止リスクのある重要タスク
- [ ] 🔥 [HIGH] 機能実装・セキュリティに直結するタスク
- [ ] ⚡ [MEDIUM] パフォーマンス・UX向上タスク
- [ ] 📝 [LOW] ドキュメント・リファクタリングタスク
```

#### 優先度判定基準
- **CRITICAL**: セキュリティホール、データ損失リスク、システム停止
- **HIGH**: 機能要件、API統合、認証・認可
- **MEDIUM**: パフォーマンス最適化、UI/UX改善
- **LOW**: コード整理、ドキュメント、将来対応

## フェーズ別TODO管理

### Phase 0: 準備・基盤整備

#### Frontend担当TODO
- [ ] 🚀 [CRITICAL] Firebase SDK依存関係追加・設定
  - [ ] package.json にFirebase SDK追加
  - [ ] Firebase config設定ファイル作成
  - [ ] 環境変数設定 (.env.local, .env.production)
- [ ] 🔥 [HIGH] 開発環境セットアップ
  - [ ] Firebase Emulator Suite設定
  - [ ] localhost:3000でEmulator接続確認
  - [ ] Hot reload動作確認
- [ ] ⚡ [MEDIUM] 既存テスト環境整備
  - [ ] 既存テストスイート実行・結果確認
  - [ ] カバレッジレポート生成
  - [ ] CI/CD環境でのテスト実行確認

#### Backend担当TODO
- [ ] 🚀 [CRITICAL] Firebase プロジェクト基盤構築
  - [ ] Firebase Console プロジェクト作成
  - [ ] Firestore Database有効化
  - [ ] Firebase Auth設定
  - [ ] Firebase Storage バケット作成
- [ ] 🔥 [HIGH] Security Rules初期実装
  - [ ] 基本認証ルール実装
  - [ ] Family境界セキュリティ実装
  - [ ] ルールテスト環境構築

#### 完了条件
- [ ] 開発環境でFirebase Emulatorが正常動作
- [ ] Frontend/Backend間基本連携確認
- [ ] 既存テストが全て成功
- [ ] セキュリティルール基本動作確認

### Phase 1: 認証・Member管理

#### Frontend担当TODO
- [ ] 🚀 [CRITICAL] Firebase Auth統合
  - [ ] src/components/auth/AuthProvider.tsx
  - [ ] src/components/auth/LoginForm.tsx
  - [ ] src/components/auth/SignupForm.tsx
  - [ ] src/components/auth/ProtectedRoute.tsx
- [ ] 🔥 [HIGH] 既存Member管理拡張
  - [ ] src/usecase/memberService.ts (Firebase連携)
  - [ ] src/infrastructure/firebase/auth/ 実装
  - [ ] src/hooks/useAppData.ts 認証状態管理拡張
- [ ] ⚡ [MEDIUM] 認証フローUI
  - [ ] ログイン・サインアップフォーム
  - [ ] エラーハンドリング・バリデーション
  - [ ] ロード状態表示

#### Backend担当TODO
- [ ] 🚀 [CRITICAL] Firebase Auth詳細設定
  - [ ] Email/Password認証設定
  - [ ] パスワードポリシー設定
  - [ ] 匿名認証設定 (必要時)
- [ ] 🔥 [HIGH] Member Collection Security Rules
  - [ ] 認証ユーザーのみアクセス制御
  - [ ] Family境界でのメンバー管理
  - [ ] 権限レベル別アクセス制御
- [ ] ⚡ [MEDIUM] 認証ログ・監視
  - [ ] 認証成功・失敗ログ
  - [ ] 不正アクセス検知
  - [ ] セッション管理

#### 完了条件
- [ ] 新規ユーザー登録フローが動作
- [ ] ログイン・ログアウトが正常動作
- [ ] 認証状態が適切に管理される
- [ ] セキュリティルールが機能
- [ ] 認証関連テストが全て成功

## 進捗管理・レポート

### 日次進捗管理

#### 進捗確認項目
```markdown
## YYYY-MM-DD 進捗レポート

### Frontend担当進捗
- [x] 完了: src/components/auth/AuthProvider.tsx実装
- [ ] 進行中: src/components/auth/LoginForm.tsx実装 (80%完了)
- [ ] 待機: 認証フローテスト実装

### Backend担当進捗
- [x] 完了: Firebase Auth Email/Password設定
- [ ] 進行中: Member Collection Security Rules実装
- [ ] 待機: 認証ログ設定

### ブロッカー・課題
- [ ] Firebase Emulator接続エラー (Frontend)
- [ ] Security Rules テスト環境構築 (Backend)

### 明日の予定
- [ ] Firebase Emulator接続問題解決
- [ ] LoginForm.tsx完成・テスト実装
```

### 週次進捗サマリー

#### 週次レビュー項目
```markdown
## Week XX (YYYY-MM-DD 〜 YYYY-MM-DD) サマリー

### 完了したマイルストーン
- [x] Phase 0完了: 基盤整備
- [x] Firebase Auth基本実装

### 進行中のタスク
- [ ] Member管理UI実装 (Frontend: 60%完了)
- [ ] Security Rules詳細実装 (Backend: 40%完了)

### 次週計画
- [ ] Phase 1完了目標
- [ ] Phase 2準備開始

### 課題・リスク
- [ ] Security Rules複雑性によるスケジュール遅延リスク
- [ ] 対策: 段階的実装・早期テスト実施
```

## 品質管理・レビュー

### コードレビュー時TODO確認

#### レビュー必須項目
```markdown
### Pull Request TODO確認

#### 機能実装確認
- [ ] 実装対象のTODOが適切に完了マーク
- [ ] 関連テストが実装・成功
- [ ] エラーハンドリングが適切

#### セキュリティ確認
- [ ] 認証・認可が適切に実装
- [ ] 入力バリデーションが実装
- [ ] XSS・インジェクション対策確認

#### パフォーマンス確認
- [ ] クエリ最適化実装
- [ ] 不要な再レンダリング防止
- [ ] メモリリーク対策確認

#### ドキュメント確認
- [ ] 変更内容がspec/に反映
- [ ] 重要な設計判断が記録
- [ ] 今後のTODOが適切に追加
```

### フェーズ完了判定

#### 完了判定チェックリスト
```markdown
### Phase X 完了判定

#### 機能要件
- [ ] 全ての機能TODO完了
- [ ] 受入テスト全て成功
- [ ] エラーハンドリング動作確認

#### 非機能要件
- [ ] パフォーマンス基準達成
- [ ] セキュリティ要件満足
- [ ] ユーザビリティ確認

#### 品質要件
- [ ] テストカバレッジ80%以上
- [ ] 静的解析エラー0件
- [ ] ドキュメント整備完了

#### 運用準備
- [ ] 監視・アラート設定
- [ ] ログ・デバッグ情報適切
- [ ] 緊急時対応手順整備
```

## ツール・自動化

### GitHub Issues活用

#### Issue作成テンプレート
```markdown
## Task: [タスク名]

### 概要
[タスクの概要・目的]

### TODO
- [ ] 具体的実装項目1
- [ ] 具体的実装項目2
- [ ] テスト実装
- [ ] ドキュメント更新

### 完了条件
- [ ] 機能動作確認
- [ ] テスト成功
- [ ] レビュー完了

### 関連
- Related to #xxx
- Part of Phase X
```

### Project Board設定

#### ボード構成
```
TODO | IN PROGRESS | REVIEW | DONE
-----|-------------|---------|-----
新規 | 作業中      | レビュー | 完了
タスク | タスク     | 待ち    | タスク
```

#### ラベル分類
- `priority:critical` - 🚀 最重要
- `priority:high` - 🔥 高
- `priority:medium` - ⚡ 中
- `priority:low` - 📝 低
- `frontend` - Frontend担当
- `backend` - Backend担当
- `security` - セキュリティ関連
- `performance` - パフォーマンス関連

## 継続的改善

### TODO管理改善プロセス

#### 振り返り項目
- [ ] TODO記述の精度・明確性向上
- [ ] 見積もり精度向上
- [ ] ブロッカー早期発見・解決
- [ ] チーム間連携効率化
- [ ] ツール・プロセス最適化

#### 改善実施サイクル
- [ ] 週次: 進捗・プロセス振り返り
- [ ] フェーズ終了時: 大幅プロセス見直し
- [ ] プロジェクト完了時: 全体総括・ナレッジ化