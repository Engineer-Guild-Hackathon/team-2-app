# Makefile for team-2-app (homelog)
# モノレポ構成: frontend/ + backend/ 分離デプロイ開発用

.PHONY: help spec-check spec-list frontend-dev frontend-build frontend-check frontend-test frontend-test-ui
.PHONY: backend-dev backend-build backend-check backend-test quality-check test-all build-all
.PHONY: dev-setup deps-update test-integration test-e2e deploy-staging deploy-production

# デフォルトターゲット
.DEFAULT_GOAL := help

# ===== 仕様書・ドキュメント関連 =====

# 仕様書の一括検証 (AGENTS.mdで要求)
spec-check:
	@echo "🔍 仕様書の整合性を検証中..."
	@echo "TODO: 仕様書整合性チェックスクリプト実装"
	@echo "✅ 仕様書チェック完了（実装予定）"

# 仕様書の表示
spec-list:
	@echo "📋 仕様書一覧:"
	@find specs/ -name "*.md" | sort

# ===== Frontend開発コマンド =====

# 開発サーバー起動
frontend-dev:
	@echo "🚀 Frontend開発サーバー起動中..."
	cd frontend && npm run dev

# フロントエンドビルド
frontend-build:
	@echo "🏗️ Frontend ビルド中..."
	cd frontend && npm run build

# フロントエンド品質チェック（型検査・リント・テスト）
frontend-check:
	@echo "✅ Frontend 品質チェック中..."
	cd frontend && npm run build
	cd frontend && npm run lint
	cd frontend && npm run test

# フロントエンドテスト（カバレッジ付き）
frontend-test:
	@echo "🧪 Frontend テスト（カバレッジ付き）実行中..."
	cd frontend && npm run test:coverage

# フロントエンドテスト（UI付き）
frontend-test-ui:
	@echo "🎮 Frontend テスト（UI付き）起動中..."
	cd frontend && npm run test:ui

# ===== Backend開発コマンド（準備） =====

# Firebase Emulator起動
backend-dev:
	@echo "🔥 Firebase Emulator起動中..."
	@echo "TODO: cd backend && firebase emulators:start"
	@echo "📝 Backend実装後に有効化予定"

# バックエンドビルド
backend-build:
	@echo "🏗️ Backend ビルド中..."
	@echo "TODO: cd backend/functions && npm run build"
	@echo "📝 Backend実装後に有効化予定"

# バックエンド品質チェック
backend-check:
	@echo "✅ Backend 品質チェック中..."
	@echo "TODO: cd backend/functions && npm run lint && npm run test"
	@echo "📝 Backend実装後に有効化予定"

# バックエンドテスト
backend-test:
	@echo "🧪 Backend テスト中..."
	@echo "TODO: cd backend/functions && npm run test:coverage"
	@echo "📝 Backend実装後に有効化予定"

# ===== 統合・品質管理コマンド =====

# 全体品質チェック (09_GUIDELINES.mdのCI/CD品質ゲートに準拠)
quality-check: frontend-check
	@echo "📊 Backend品質チェックをスキップ（未実装）"
	@echo "✅ 全体品質チェック完了（Frontend完了、Backend準備中）"

# 全体テスト実行
test-all: frontend-test
	@echo "📊 Backendテストをスキップ（未実装）"
	@echo "🧪 全体テスト完了（Frontend完了、Backend準備中）"

# 全体ビルド
build-all: frontend-build
	@echo "📊 Backendビルドをスキップ（未実装）"
	@echo "🏗️ 全体ビルド完了（Frontend完了、Backend準備中）"

# 開発環境セットアップ
dev-setup:
	@echo "🚀 開発環境セットアップ中..."
	@echo "📦 Frontend依存関係インストール..."
	cd frontend && npm install
	@echo "📝 TODO: cd backend/functions && npm install"
	@echo "✅ 開発環境セットアップ完了（Frontend完了、Backend準備中）"

# 依存関係更新
deps-update:
	@echo "🔄 依存関係更新中..."
	@echo "📦 Frontend依存関係更新..."
	cd frontend && npm update
	@echo "📝 TODO: cd backend/functions && npm update"
	@echo "✅ 依存関係更新完了（Frontend完了、Backend準備中）"

# ===== 統合テスト・E2Eテスト（将来実装） =====

# 統合テスト (07_TESTPLAN.mdの統合テスト戦略に準拠)
test-integration:
	@echo "🔄 統合テスト実行中..."
	@echo "TODO: Firebase Emulator + MSW統合テスト"
	@echo "📝 Backend実装後に有効化予定"

# E2Eテスト
test-e2e:
	@echo "🎭 E2Eテスト実行中..."
	@echo "TODO: Playwright/Cypress E2Eテスト"
	@echo "📝 Backend実装後に有効化予定"

# ===== デプロイ・運用コマンド =====

# ステージング環境デプロイ
deploy-staging:
	@echo "📤 ステージング環境デプロイ中..."
	@echo "Frontend: TODO: npm run deploy:staging"
	@echo "Backend: TODO: cd backend && firebase deploy --project staging"
	@echo "📝 環境設定後に有効化予定"

# 本番環境デプロイ
deploy-production:
	@echo "🚀 本番環境デプロイ中..."
	@echo "Frontend: TODO: npm run deploy:production"
	@echo "Backend: TODO: cd backend && firebase deploy --project production"
	@echo "📝 環境設定後に有効化予定"

# ===== ヘルプ・情報表示 =====

# ヘルプ表示
help:
	@echo "📖 team-2-app (homelog) 利用可能なコマンド:"
	@echo ""
	@echo "  🔧 開発関連:"
	@echo "    make frontend-dev     - Frontend開発サーバー起動"
	@echo "    make backend-dev      - Firebase Emulator起動 [準備中]"
	@echo "    make dev-setup        - 開発環境セットアップ"
	@echo ""
	@echo "  ✅ 品質管理:"
	@echo "    make frontend-check   - Frontend品質チェック（ビルド・リント・テスト）"
	@echo "    make backend-check    - Backend品質チェック [準備中]"
	@echo "    make quality-check    - 全体品質チェック"
	@echo "    make spec-check       - 仕様書整合性検証 [準備中]"
	@echo ""
	@echo "  🧪 テスト:"
	@echo "    make frontend-test    - Frontendテスト（カバレッジ付き）"
	@echo "    make frontend-test-ui - Frontendテスト（UI付き）"
	@echo "    make backend-test     - Backendテスト [準備中]"
	@echo "    make test-all         - 全体テスト"
	@echo "    make test-integration - 統合テスト [準備中]"
	@echo "    make test-e2e         - E2Eテスト [準備中]"
	@echo ""
	@echo "  🏗️ ビルド:"
	@echo "    make frontend-build   - Frontendビルド"
	@echo "    make backend-build    - Backendビルド [準備中]"
	@echo "    make build-all        - 全体ビルド"
	@echo ""
	@echo "  📋 仕様書:"
	@echo "    make spec-list        - 仕様書一覧表示"
	@echo "    make spec-check       - 仕様書整合性検証 [準備中]"
	@echo ""
	@echo "  🔄 保守:"
	@echo "    make deps-update      - 依存関係更新"
	@echo ""
	@echo "  🚀 デプロイ:"
	@echo "    make deploy-staging   - ステージング環境デプロイ [準備中]"
	@echo "    make deploy-production - 本番環境デプロイ [準備中]"
	@echo ""
	@echo "  📝 注記:"
	@echo "    [準備中] = Backend実装後に有効化予定"
	@echo "    現在はFrontend機能のみ実装済み"
	@echo ""
	@echo "  📚 詳細な開発ガイドライン: AGENTS.md を参照"