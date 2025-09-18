# specs/03_USECASES.md (ユースケース定義)

> バージョン: v0.2 (2025-09-18 JST)
> Frontend/Backend分離アーキテクチャのユースケース定義

## ユースケース概要

`08_ARCH.md`で定義されたFrontend/Backend分離アーキテクチャに基づき、システムの振る舞いを定義する。FrontendはBackend APIとの通信に責務を持ち、Backendがビジネスロジックとデータ永続化の責務を持つ。

## アクター定義

### Primary Actors
- **Child (子)**: タスク実行、証拠記録の主体となるユーザー
- **Parent (親)**: 家族管理、進捗確認の責任者となるユーザー

### Secondary Actors
- **Frontend Application (フロントエンド)**: ユーザーが直接操作するUI。ローカルキャッシュ(Dexie)を持ち、オフライン対応を行う。Backend APIと通信する。
- **Backend Application (バックエンド)**: APIを提供し、ビジネスロジックを実行する。Firestore, Firebase Storageと通信する。
- **System (外部システム)**: Firebase Auth, Firestore, Firebase Storageなどのクラウドサービス。

## 主要ユースケース

### Family・Member管理

#### UC-FAM-001: 家族アカウント作成
**アクター**: Parent
**前提条件**: Firebase Authで認証済みである。
**メインフロー**:
1. Parentがアプリ上で新規Family作成を選択する。
2. 家族名などを入力する。
3. **Frontend**: Backend APIに家族作成リクエストを送信する (`POST /api/families`)。
4. **Backend**: リクエストを検証し、Firestore内に新しいFamilyドキュメントを作成する。
5. **Backend**: リクエスト元のParentを管理者としてFamilyドキュメントに記録する。
6. **Backend**: 成功レスポンスをFrontendに返す。
**事後条件**: 新しいFamilyが作成され、Parentが管理者として紐づく。

#### UC-MEM-001: 子どもメンバー追加
**アクター**: Parent
**前提条件**: ParentがFamilyの管理者である。
**メインフロー**:
1. Parentがメンバー追加画面を開く。
2. 子どもの名前などを入力する。
3. **Frontend**: Backend APIにメンバー追加リクエストを送信する (`POST /api/families/{familyId}/members`)。
4. **Backend**: リクエストを検証し、新しいMemberドキュメントをFirestoreに作成し、招待用のメンバーコードを生成する。
5. **Backend**: 作成されたメンバー情報とメンバーコードをFrontendに返す。
**事後条件**: 新しいChildメンバーが作成され、招待準備が整う。

#### UC-MEM-002: デバイス認証・連携
**アクター**: Child
**前提条件**: Parentから有効なメンバーコードを共有されている。
**メインフロー**:
1. Childが新しいデバイスでアプリを起動し、「メンバーコードで参加」を選択する。
2. メンバーコードを入力する。
3. **Frontend**: Backend APIにメンバーコード検証リクエストを送信する (`POST /api/families/join`)。
4. **Backend**: メンバーコードを検証し、対応するMemberドキュメントを特定する。
5. **Backend**: Firebase Authで匿名ユーザー等を作成し、そのAuthUIDをMemberドキュメントに紐付け、認証トークンを生成してFrontendに返す。
6. **Frontend**: 認証トークンを保存し、ログイン状態となる。ローカルキャッシュ(Dexie)の初期同期を開始する。
**事後条件**: Childのデバイスがアカウントに紐づき、アプリが利用可能になる。

### Task管理

#### UC-TSK-001: タスク作成
**アクター**: Parent
**前提条件**: Parentがログインしている。
**メインフロー**:
1. Parentがタスク作成画面で、タイトル、担当Childなどを入力する。
2. **Frontend**: Backend APIにタスク作成リクエストを送信する (`POST /api/families/{familyId}/tasks`)。
3. **Backend**: リクエストを検証し、TaskドキュメントをFirestoreに作成する。
4. **Backend**: (任意) 担当Childのデバイスにプッシュ通知などをトリガーする。
5. **Backend**: 作成されたタスク情報をFrontendに返す。
6. **Frontend**: レスポンスを受け取り、ローカルキャッシュを更新し、UIに新しいタスクを表示する。
**事後条件**: 新しいタスクが作成され、家族間で共有される。
**例外フロー**: オフライン時はローカルキャッシュに保存し、オンライン復帰後にBackend APIにリクエストを送信する(同期キュー)。

#### UC-TSK-002: タスク進捗更新
**アクター**: Child
**前提条件**: Childにタスクが割り当てられている。
**メインフロー**:
1. Childがタスク一覧から自身のタスクを選択し、ステータスを変更する (例: `todo` -> `doing`)。
2. **Frontend**: Backend APIに進捗更新リクエストを送信する (`PATCH /api/families/{familyId}/tasks/{taskId}`)。
3. **Backend**: リクエストを検証し、該当するTaskドキュメントをFirestoreで更新する。
4. **Backend**: 更新後のタスク情報を返す。
5. **Frontend**: レスポンスを受け取り、ローカルキャッシュとUIを更新する。
**事後条件**: タスクの進捗がリアルタイムで家族間に共有される。

### Evidence管理

#### UC-EVD-001: 証拠投稿 (ファイルあり)
**アクター**: Child, Parent
**前提条件**: ユーザーがログインしている。
**メインフロー**:
1. ユーザーが写真撮影やファイル選択を行う。
2. 関連タスクやコメントなどを入力する。
3. **Frontend**: Backend APIに証拠のメタデータ(コメント等)を送信し、ファイルアップロードURLを要求する (`POST /api/families/{familyId}/evidence`)。
4. **Backend**: リクエストを検証し、Evidenceドキュメント(メタデータのみ)をFirestoreに作成する。
5. **Backend**: Firebase Storage用の署名付きアップロードURLを生成し、Frontendに返す。
6. **Frontend**: 受け取った署名付きURLを使い、ファイルを直接Firebase Storageにアップロードする。
7. **Frontend**: (任意) アップロード完了後、Backend APIに通知し、Backend側でEvidenceドキュメントのステータスを更新する。
**事後条件**: 証拠ファイルがStorageに保存され、メタデータがFirestoreに記録される。
**例外フロー**: アップロード失敗時はリトライ処理を行う。ストレージ上限超過時はBackendがエラーを返し、Frontendがユーザーに通知する。

#### UC-EVD-002: 証拠投稿 (テキストのみ)
**アクター**: Child, Parent
**前提条件**: ユーザーがログインしている。
**メインフロー**:
1. ユーザーがテキストで感想や記録を入力する。
2. **Frontend**: Backend APIにテキストを含む証拠作成リクエストを送信する (`POST /api/families/{familyId}/evidence`)。
3. **Backend**: リクエストを検証し、テキスト情報を含むEvidenceドキュメントをFirestoreに作成する。
4. **Backend**: 作成された証拠情報をFrontendに返す。
5. **Frontend**: レスポンスを受け取り、ローカルキャッシュとUIを更新する。
**事後条件**: テキストの証拠がFirestoreに記録される。

### 同期と認証

#### UC-SYNC-001: オフライン・オンライン同期
**アクター**: Frontend Application
**トリガー**: ネットワーク状態の変化。
**メインフロー**:
1. **Frontend**: デバイスがオフラインになったことを検知する。以降の作成・更新操作はローカルキャッシュ(Dexie)に保存し、同期キューに追加する。
2. **Frontend**: デバイスがオンラインに復帰したことを検知する。
3. **Frontend**: 同期キューに溜まっているリクエストを、順次Backend APIに送信する。
4. **Backend**: APIリクエストを通常通り処理する。
5. **Frontend**: APIからのレスポンスに基づき、ローカルキャッシュのデータを更新・整合性を確保する。
**事後条件**: オフライン中に行った変更がサーバーと同期され、データの整合性が保たれる。

#### UC-AUTH-001: API認証
**アクター**: Frontend Application
**トリガー**: Backend APIへのリクエスト時。
**メインフロー**:
1. **Frontend**: Firebase Auth SDKを使い、現在のユーザーのIDトークンを取得する。
2. **Frontend**: Backend APIへのリクエストヘッダーに `Authorization: Bearer <IDトークン>` を含める。
3. **Backend**: APIリクエストを受け取ると、認証ミドルウェアがIDトークンを検証する。
4. **Backend**: トークンが有効であれば、リクエストに含まれるユーザーID(AuthUID)を信頼し、後続の処理（認可チェック等）に進む。
**事後条件**: APIリクエストが正規のユーザーからのものであることが検証される。
**例外フロー**: トークンが無効・期限切れの場合、Backendは `401 Unauthorized` エラーを返し、Frontendは再ログインを促す。
