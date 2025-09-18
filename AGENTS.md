# AGENTS /init 索引（仕様運用ルール）

- **SSOT (Single Source of Truth):**
  - **全体仕様:** `/specs/*.md`
  - **API契約:** `specs/04_API.md` (エンドポイント定義), `specs/05_SCHEMAS.md` (データスキーマ)

- **ID管理:** REQ/NFR/UC/ACC は重複禁止・一意。参照は `[REQ-101]` の形式

- **コマンド:**
  - **仕様書関連:**
    - `make spec-check`: 仕様書の一括検証
  - **実装/テスト関連:**
    - Frontend/Backendそれぞれの具体的なコマンドは `07_TESTPLAN.md` および `09_GUIDELINES.md` を参照。

- **開発フロー:**
  1. 仕様（`/specs`）を更新
  2. `make spec-check` で仕様書の整合性を検証
  3. Frontend/Backendそれぞれの実装およびテスト (`07_TESTPLAN.md` 参照)

- **PR運用:** `.github/pull_request_template.md` に ACC-ID を必須記載