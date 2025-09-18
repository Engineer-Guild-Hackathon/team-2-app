# コントリビューションガイドライン

このプロジェクトへの貢献に関心を持っていただきありがとうございます。  
Issue 報告や Pull Request 提出の際には、以下のガイドラインに従ってください。

---

## Issue を作成するには
- バグ報告 → [Bug Report テンプレート](./ISSUE_TEMPLATE/bug_report.yml) を利用してください。
- 機能要望 → [Feature Request テンプレート](./ISSUE_TEMPLATE/feature_request.yml) を利用してください。
- 既存の Issue を検索し、同様のものがないか確認してください。

---

## Pull Request を送るには
1. 作業用のブランチを作成してください（例: `feat/123-add-login`）。
2. コードを修正／追加し、必要に応じてテストを更新してください。
3. Lint・フォーマットチェックを必ず実行してください。
   - Node.js: `npm run lint` / `npm run format:check`
   - Go: `gofmt -s -l .` / `go vet ./...`
4. [Pull Request テンプレート](./PULL_REQUEST_TEMPLATE/default.md) を使って PR を作成してください。
5. 関連する Issue がある場合は `fixes #番号` を本文に書いてください。

---

## コミットメッセージ規約
- [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) に準拠してください。
- フォーマット例:
```markdown
feat(frontend): ログイン画面を追加
fix(backend): 認証トークンの検証処理を修正
```
- `.github/COMMIT_TEMPLATE.txt` を利用することで統一的なメッセージが書けます。

---

## ブランチ命名規則
- 形式: `<type>/<issue番号>-<簡潔な説明>`  
例: `feat/123-add-login`, `fix/101-fix-auth-bug`
- `type` は以下を使用してください:
- `feat` 新機能
- `fix` バグ修正
- `refactor` リファクタリング
- `docs` ドキュメント
- `test` テスト関連
- `chore` 雑務・依存更新
- 詳細は [.github/BRANCHING_GUIDE.md](./templates/BRANCHING_GUIDE.md) を参照してください。

---

## 開発環境（Dev Containers）
- Node.js 18 / Go 1.23 がセットアップされた [Dev Container](../.devcontainer/devcontainer.json) を利用できます。
- VSCode を使用している場合は、推奨拡張（ESLint/Prettier/Go）が自動で有効になります。

---

## コードスタイル
- Node.js/TypeScript: ESLint + Prettier  
- Go: gofmt / go vet  
- CI 上で自動チェックが走るため、ローカルでも事前に実行してください。

---

## 行動規範
本プロジェクトは健全な開発体験を大切にしています。  
- 互いを尊重し、建設的なフィードバックを心がけてください。  
- ハラスメントや攻撃的な発言は禁止です。  

---

ご協力ありがとうございます 🙏
