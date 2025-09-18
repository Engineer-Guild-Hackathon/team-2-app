# specs/04_API.md (RESTful API設計)

> バージョン: v0.2 (2025-09-17 JST)
> Backend: Firebase Functions RESTful API設計

## API設計概要

### RESTful API アーキテクチャ
- **Base URL**: `https://your-project.cloudfunctions.net/api`
- **認証**: Bearer Token (Firebase Auth JWT)
- **Content-Type**: `application/json`
- **File Upload**: `multipart/form-data`

### 認証・認可フロー
```
1. Frontend: Firebase Auth 認証
2. Frontend: Auth Token取得
3. Frontend: API Request (Authorization: Bearer {token})
4. Backend: Token検証・Family境界チェック
5. Backend: Firestore操作実行
6. Backend: Response返却
```

## API エンドポイント設計

### 認証 API

#### POST /api/auth/verify
Firebase Auth Token検証・ユーザー情報取得

**Request Headers:**
```
Authorization: Bearer {firebase_auth_token}
```

**Response:**
```json
{
  "userId": "firebase_uid",
  "email": "user@example.com",
  "families": [
    {
      "familyId": "uuid-v4",
      "role": "parent",
      "displayName": "田中太郎"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### Family API

#### GET /api/families/:familyId
Family情報取得

**Request Headers:**
```
Authorization: Bearer {firebase_auth_token}
```

**Response:**
```json
{
  "familyId": "uuid-v4",
  "name": "田中家",
  "storageQuotaBytes": 1073741824,
  "storageUsedBytes": 524288000,
  "createdAt": "2025-09-17T10:00:00.000Z",
  "updatedAt": "2025-09-17T10:00:00.000Z"
}
```

#### POST /api/families
新規Family作成

**Request Body:**
```json
{
  "name": "田中家"
}
```

**Response:**
```json
{
  "familyId": "uuid-v4",
  "name": "田中家",
  "storageQuotaBytes": 1073741824,
  "storageUsedBytes": 0,
  "createdAt": "2025-09-17T10:00:00.000Z",
  "updatedAt": "2025-09-17T10:00:00.000Z"
}
```

#### PUT /api/families/:familyId
Family情報更新

**Request Body:**
```json
{
  "name": "田中家ファミリー",
  "storageQuotaBytes": 2147483648
}
```

#### GET /api/families/:familyId/storage
ストレージ使用量詳細取得

**Response:**
```json
{
  "familyId": "uuid-v4",
  "storageQuotaBytes": 1073741824,
  "storageUsedBytes": 524288000,
  "usagePercentage": 48.8,
  "breakdown": {
    "photos": 314572800,
    "audio": 157286400,
    "other": 52428800
  },
  "lastUpdated": "2025-09-17T10:00:00.000Z"
}
```

### Member API

#### GET /api/families/:familyId/members
Family内Member一覧取得

**Response:**
```json
{
  "members": [
    {
      "memberId": "uuid-v4",
      "familyId": "uuid-v4",
      "role": "parent",
      "displayName": "田中太郎",
      "birthYear": 1980,
      "memberCode": "ABC12345",
      "authUid": "firebase_uid",
      "createdAt": "2025-09-17T10:00:00.000Z",
      "updatedAt": "2025-09-17T10:00:00.000Z"
    },
    {
      "memberId": "uuid-v4",
      "familyId": "uuid-v4",
      "role": "child",
      "displayName": "田中花子",
      "birthYear": 2010,
      "memberCode": null,
      "authUid": "firebase_uid_2",
      "createdAt": "2025-09-17T10:00:00.000Z",
      "updatedAt": "2025-09-17T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/families/:familyId/members
新規Member追加

**Request Body:**
```json
{
  "role": "child",
  "displayName": "田中次郎",
  "birthYear": 2015
}
```

**Response:**
```json
{
  "memberId": "uuid-v4",
  "familyId": "uuid-v4",
  "role": "child",
  "displayName": "田中次郎",
  "birthYear": 2015,
  "memberCode": "XYZ67890",
  "authUid": null,
  "createdAt": "2025-09-17T10:00:00.000Z",
  "updatedAt": "2025-09-17T10:00:00.000Z"
}
```

#### PUT /api/families/:familyId/members/:memberId
Member情報更新

**Request Body:**
```json
{
  "displayName": "田中次郎（更新）",
  "birthYear": 2016
}
```

#### DELETE /api/families/:familyId/members/:memberId
Member削除

**Response:**
```json
{
  "message": "Member deleted successfully"
}
```

### Task API

#### GET /api/families/:familyId/tasks
Task一覧取得

**Query Parameters:**
- `assignee`: Member ID フィルタ
- `status`: ステータスフィルタ (`todo`, `doing`, `done`, `done_with_evidence`)
- `type`: タスク種別フィルタ (`test`, `homework`, `inquiry`, `life`)
- `limit`: 取得件数制限 (default: 100, max: 1000)
- `offset`: オフセット (ページネーション)
- `sort`: ソート順 (`created_at`, `updated_at`, `due`) + `asc`/`desc`

**Example Request:**
```
GET /api/families/uuid-v4/tasks?assignee=uuid-child&status=todo&limit=50&sort=due_asc
```

**Response:**
```json
{
  "tasks": [
    {
      "taskId": "uuid-v4",
      "familyId": "uuid-v4",
      "assigneeMemberId": "uuid-child",
      "title": "算数の宿題",
      "type": "homework",
      "status": "todo",
      "progress": 0,
      "subject": "算数",
      "due": "2025-09-20T15:00:00.000Z",
      "createdAt": "2025-09-17T10:00:00.000Z",
      "updatedAt": "2025-09-17T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasNext": true
  }
}
```

#### GET /api/families/:familyId/tasks/:taskId
Task詳細取得

**Response:**
```json
{
  "taskId": "uuid-v4",
  "familyId": "uuid-v4",
  "assigneeMemberId": "uuid-child",
  "title": "算数の宿題",
  "type": "homework",
  "status": "doing",
  "progress": 50,
  "subject": "算数",
  "due": "2025-09-20T15:00:00.000Z",
  "createdAt": "2025-09-17T10:00:00.000Z",
  "updatedAt": "2025-09-17T12:00:00.000Z",
  "evidence": [
    {
      "evidenceId": "uuid-v4",
      "kind": "photo",
      "blobRef": "gs://bucket/families/uuid-v4/evidence/uuid-v4.jpg",
      "createdAt": "2025-09-17T11:00:00.000Z"
    }
  ]
}
```

#### POST /api/families/:familyId/tasks
新規Task作成

**Request Body:**
```json
{
  "assigneeMemberId": "uuid-child",
  "title": "国語の音読",
  "type": "homework",
  "subject": "国語",
  "due": "2025-09-25T15:00:00.000Z"
}
```

**Response:** Task詳細JSON

#### PUT /api/families/:familyId/tasks/:taskId
Task更新

**Request Body:**
```json
{
  "title": "国語の音読（更新）",
  "status": "doing",
  "progress": 30,
  "due": "2025-09-26T15:00:00.000Z"
}
```

#### DELETE /api/families/:familyId/tasks/:taskId
Task削除

### Evidence API

#### GET /api/families/:familyId/evidence
Evidence一覧取得

**Query Parameters:**
- `childMember`: Child Member ID フィルタ
- `taskId`: Task ID フィルタ
- `kind`: Evidence種別フィルタ (`photo`, `voice`, `note`)
- `tags`: タグフィルタ (カンマ区切り)
- `since`: 作成日時フィルタ (ISO 8601)
- `until`: 作成日時フィルタ (ISO 8601)
- `limit`: 取得件数制限
- `offset`: オフセット

**Response:**
```json
{
  "evidence": [
    {
      "evidenceId": "uuid-v4",
      "familyId": "uuid-v4",
      "taskId": "uuid-task",
      "childMemberId": "uuid-child",
      "kind": "photo",
      "blobRef": "gs://bucket/families/uuid-v4/evidence/uuid-v4.jpg",
      "text": null,
      "tags": ["observe", "express"],
      "createdAt": "2025-09-17T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 500,
    "limit": 100,
    "offset": 0,
    "hasNext": true
  }
}
```

#### GET /api/families/:familyId/evidence/:evidenceId
Evidence詳細取得

**Response:**
```json
{
  "evidenceId": "uuid-v4",
  "familyId": "uuid-v4",
  "taskId": "uuid-task",
  "childMemberId": "uuid-child",
  "kind": "photo",
  "blobRef": "gs://bucket/families/uuid-v4/evidence/uuid-v4.jpg",
  "downloadUrl": "https://storage.googleapis.com/bucket/signed-url",
  "text": "算数の問題を解きました",
  "tags": ["observe", "express"],
  "createdAt": "2025-09-17T11:00:00.000Z",
  "relatedTask": {
    "taskId": "uuid-task",
    "title": "算数の宿題",
    "status": "doing"
  }
}
```

#### POST /api/families/:familyId/evidence
新規Evidence作成

**Request Body:**
```json
{
  "taskId": "uuid-task",
  "childMemberId": "uuid-child",
  "kind": "note",
  "text": "今日は算数の問題がよく解けました",
  "tags": ["observe", "express"]
}
```

**Response:** Evidence詳細JSON

#### POST /api/families/:familyId/evidence/:evidenceId/file
Evidenceファイルアップロード

**Request:**
```
Content-Type: multipart/form-data

file: {binary_file_data}
```

**Response:**
```json
{
  "evidenceId": "uuid-v4",
  "blobRef": "gs://bucket/families/uuid-v4/evidence/uuid-v4.jpg",
  "downloadUrl": "https://storage.googleapis.com/bucket/signed-url",
  "fileSize": 2048576,
  "contentType": "image/jpeg"
}
```

#### DELETE /api/families/:familyId/evidence/:evidenceId
Evidence削除

### Recommendation API

#### GET /api/families/:familyId/recommendations
Recommendation一覧取得

**Query Parameters:**
- `targetMember`: 対象Member ID フィルタ
- `kind`: 推奨種別フィルタ (`question`, `book`, `place`)

**Response:**
```json
{
  "recommendations": [
    {
      "recommendId": "uuid-v4",
      "familyId": "uuid-v4",
      "targetMemberId": "uuid-child",
      "kind": "book",
      "title": "算数が楽しくなる本",
      "reason": "算数の問題解決能力が向上しているため",
      "createdAt": "2025-09-17T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/families/:familyId/recommendations
新規Recommendation作成

**Request Body:**
```json
{
  "targetMemberId": "uuid-child",
  "kind": "question",
  "title": "どんな問題が一番難しかった？",
  "reason": "最近の算数の取り組みについて対話を促進するため"
}
```

## エラーハンドリング

### 標準エラーレスポンス形式

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "validation error details"
  },
  "timestamp": "2025-09-17T10:00:00.000Z",
  "requestId": "uuid-v4"
}
```

### エラーコード定義

#### 認証・認可エラー (4xx)
- `UNAUTHORIZED` (401): 認証トークンが無効・期限切れ
- `FORBIDDEN` (403): アクセス権限なし・Family境界違反
- `INVALID_TOKEN` (401): トークン形式不正

#### バリデーションエラー (400)
- `VALIDATION_ERROR`: リクエストボディ検証失敗
- `INVALID_FAMILY_ID`: Family ID形式不正
- `INVALID_MEMBER_ID`: Member ID形式不正
- `INVALID_FILE_FORMAT`: アップロードファイル形式不正
- `FILE_TOO_LARGE`: ファイルサイズ上限超過

#### リソースエラー (404)
- `FAMILY_NOT_FOUND`: 指定Familyが存在しない
- `MEMBER_NOT_FOUND`: 指定Memberが存在しない
- `TASK_NOT_FOUND`: 指定Taskが存在しない
- `EVIDENCE_NOT_FOUND`: 指定Evidenceが存在しない

#### サーバーエラー (5xx)
- `INTERNAL_ERROR`: サーバー内部エラー
- `FIRESTORE_ERROR`: Firestore操作エラー
- `STORAGE_ERROR`: Firebase Storage操作エラー
- `RATE_LIMITED`: API呼び出し回数制限超過

## 認証・セキュリティ仕様

### JWT Token検証フロー

```typescript
// Backend: Token検証ミドルウェア
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // "Bearer {token}"

    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided' });
    }

    // Firebase Auth Token検証
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid token' });
  }
}
```

### Family境界チェック

```typescript
// Backend: Family境界検証
async function validateFamilyAccess(familyId: string, userUid: string): Promise<Member | null> {
  const memberQuery = await db
    .collection('families')
    .doc(familyId)
    .collection('members')
    .where('auth_uid', '==', userUid)
    .get();

  if (memberQuery.empty) {
    throw new Error('FORBIDDEN: User not member of this family');
  }

  return memberQuery.docs[0].data() as Member;
}
```

### Rate Limiting

```typescript
// Backend: レート制限実装例
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 100, // 100 requests per minute
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests'
  }
});
```

## API実装ガイドライン

### RESTful設計原則
- [ ] 適切なHTTPメソッド使用 (GET/POST/PUT/DELETE)
- [ ] リソース指向URL設計
- [ ] ステートレス設計
- [ ] 適切なHTTPステータスコード返却

### パフォーマンス最適化
- [ ] Firestore クエリ最適化・インデックス活用
- [ ] ページネーション実装 (limit/offset)
- [ ] キャッシュ戦略 (Redis/Memcache)
- [ ] 並行処理・非同期処理活用

### セキュリティ実装
- [ ] 全エンドポイント認証必須
- [ ] Family境界チェック必須
- [ ] 入力バリデーション・サニタイゼーション
- [ ] SQL/NoSQLインジェクション対策