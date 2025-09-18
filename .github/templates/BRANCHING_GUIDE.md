# ブランチ命名規則

以下はこのプロジェクトで推奨されるブランチ名の形式です。統一することで履歴・レビュー・CI の管理をしやすくします。

## 命名パターン

<type>/<ticketの識別子>-<簡潔な説明>

## type の例

| type | 用途 |
|------|------|
| feat       | 新しい機能 |
| fix        | バグ修正 |
| refactor   | リファクタリング |
| docs       | ドキュメント変更 |
| style      | コードスタイルのみ（動作に影響なし） |
| test       | テスト追加・修正 |
| ci         | CI／ワークフロー修正 |
| chore      | 雑務・依存関係の更新など |

## ticket の識別子

- Issue 番号（GitHub Issue）を使う例: `feat/123-user-login`  
- チケット管理サービス（Jira 等）を使っているならそれを書いてもよい。例: `fix/JIRA-456-fix-error-handler`

## 短い説明

- ハイフン（`-`）区切りで単語を繋げる。  
- 動詞は原形（imperative）を使う。例: `add-login`, `fix-auth-error` 等。  
- 全て小文字／短めを心掛ける。冗長な表現は避ける。

---

## 利点と注意点

- 利点：履歴がわかりやすくなる、PR や issue と紐づけやすい、意図が把握しやすい  
- 注意点：長くならないように・命名規則をチームで共有して徹底すること  

---

## 例

feat/100-implement-auth
fix/101-correct-typo-in-config
refactor/backend-module-structure
docs/update-readme
chore/update-dependencies
