# specs/10_GUARDS.md (セキュリティ・制約事項)

> バージョン: v0.2 (2025-09-17 JST)
> モノレポ構成: frontend/ + backend/ 分離アーキテクチャのセキュリティ・制約事項定義

## セキュリティ・制約概要

frontend/の既存実装とbackend/のFirebase Functions APIにおける、モノレポ・分離デプロイ環境での包括的なセキュリティ対策と運用制約の定義

### セキュリティ方針
- **Defense in Depth**: Frontend/Backend/Firebase 多層防御によるセキュリティ確保
- **Zero Trust**: すべてのAPI呼び出しとデータアクセスを検証・認証
- **Principle of Least Privilege**: 最小権限の原則 (Role-based Access Control)
- **Family境界**: 厳格なFamily境界によるデータ分離・プライバシー保護
- **API Contract Security**: API境界でのセキュリティ検証と入力バリデーション

## Frontend セキュリティ実装

### クライアントサイドセキュリティ

#### API Client セキュリティ
```typescript
// frontend/src/infrastructure/api/securityClient.ts
export class SecureApiClient {
  private authService: AuthService;
  private tokenRefreshThreshold = 5 * 60 * 1000; // 5分前

  constructor(baseUrl: string, authService: AuthService) {
    this.authService = authService;
  }

  async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // 1. Token有効性チェック・自動更新
    await this.ensureValidToken();

    // 2. セキュアなHTTPヘッダー設定
    const headers = await this.buildSecureHeaders();

    // 3. リクエスト送信
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    // 4. レスポンスセキュリティ検証
    await this.validateResponse(response);

    // 5. エラーハンドリング
    if (!response.ok) {
      throw await this.handleApiError(response);
    }

    return response.json();
  }

  private async buildSecureHeaders(): Promise<Record<string, string>> {
    const token = await this.authService.getAuthToken();

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache'
    };
  }

  private async validateResponse(response: Response): Promise<void> {
    // CSRFトークン検証
    const csrfToken = response.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      throw new SecurityError('Missing CSRF token in response');
    }

    // Content-Type検証
    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('application/json')) {
      throw new SecurityError('Invalid content type');
    }
  }
}
```

#### 入力サニタイゼーション・バリデーション
```typescript
// frontend/src/domain/validation/securityValidator.ts
export class SecurityValidator {
  // XSS対策: HTMLエスケープ
  static escapeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // SQLインジェクション対策: 入力文字制限
  static validateTaskTitle(title: string): ValidationResult {
    if (title.length > 200) {
      return { valid: false, error: 'Title too long' };
    }

    // 危険な文字パターンチェック
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(title)) {
        return { valid: false, error: 'Invalid characters detected' };
      }
    }

    return { valid: true };
  }

  // ファイルアップロードセキュリティ
  static validateFileUpload(file: File): ValidationResult {
    // ファイルサイズチェック
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return { valid: false, error: 'File too large' };
    }

    // MIMEタイプチェック
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'audio/mp3', 'audio/wav', 'audio/webm'
    ];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // ファイル拡張子チェック
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'webm'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'File extension not allowed' };
    }

    return { valid: true };
  }
}
```

## Backend セキュリティ実装

### Firebase Functions セキュリティ

#### 認証ミドルウェア
```typescript
// backend/functions/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Authorizationヘッダー検証
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    // 2. Tokenの抽出・検証
    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    // 3. Token有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < now) {
      res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      });
      return;
    }

    // 4. ユーザー情報をリクエストに付与
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token verification failed'
    });
  }
}

// Family境界チェックミドルウェア
export async function validateFamilyAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { familyId } = req.params;
    const userUid = req.user.uid;

    // Family内のMemberとして登録されているかチェック
    const memberQuery = await getFirestore()
      .collection('families')
      .doc(familyId)
      .collection('members')
      .where('auth_uid', '==', userUid)
      .get();

    if (memberQuery.empty) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'User is not a member of this family'
      });
      return;
    }

    // Member情報をリクエストに付与
    req.member = memberQuery.docs[0].data();
    next();
  } catch (error) {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Family access validation failed'
    });
  }
}
```

### Firestore Security Rules

#### 基本セキュリティ方針
```javascript
// backend/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証必須の基本関数
    function isAuthenticated() {
      return request.auth != null;
    }

    // Family境界チェック関数
    function isFamilyMember(familyId) {
      return exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
    }

    // Parent権限チェック関数
    function isParentInFamily(familyId) {
      let memberDoc = get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
      return memberDoc.data.role == 'parent';
    }

    // Child権限チェック関数
    function isChildInFamily(familyId) {
      let memberDoc = get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
      return memberDoc.data.role == 'child';
    }

    // データ整合性チェック関数
    function isValidTaskData(data) {
      return data.keys().hasAll(['task_id', 'family_id', 'assignee_member_id', 'title', 'type', 'status']) &&
             data.title is string && data.title.size() > 0 && data.title.size() <= 200 &&
             data.type in ['test', 'homework', 'inquiry', 'life'] &&
             data.status in ['todo', 'doing', 'done', 'done_with_evidence'] &&
             data.progress is number && data.progress >= 0 && data.progress <= 100;
    }
  }
}
```

#### Family Collection Rules (分離アーキテクチャ対応)
```javascript
// backend/firestore.rules
// Family境界の厳格な制御
match /families/{family_id} {
  // Familyドキュメント: メンバーのみアクセス可
  allow read: if isAuthenticated() && isFamilyMember(family_id);
  allow write: if isAuthenticated() && isParentInFamily(family_id);

  // Members サブコレクション
  match /members/{member_id} {
    allow read: if isAuthenticated() && isFamilyMember(family_id);
    allow create: if isAuthenticated() && (
      // 新規Family作成時の初期Parent
      !exists(/databases/$(database)/documents/families/$(family_id)) ||
      // 既存FamilyへのChild追加 (Parent権限必要)
      isParentInFamily(family_id)
    ) && isValidMemberData(request.resource.data);
    allow update: if isAuthenticated() && (
      isParentInFamily(family_id) ||
      // 自分の情報更新 (ロール変更は不可)
      (member_id == request.auth.uid &&
       request.resource.data.role == resource.data.role &&
       request.resource.data.family_id == resource.data.family_id)
    );
    allow delete: if isAuthenticated() && isParentInFamily(family_id);
  }

  // Tasks サブコレクション
  match /tasks/{task_id} {
    allow read: if isAuthenticated() && isFamilyMember(family_id);
    allow create: if isAuthenticated() &&
                  isParentInFamily(family_id) &&
                  isValidTaskData(request.resource.data) &&
                  request.resource.data.family_id == family_id;
    allow update: if isAuthenticated() && (
      isParentInFamily(family_id) ||
      // Child: 自分のタスクのみ、ステータス・進捗のみ更新可
      (isChildInFamily(family_id) &&
       resource.data.assignee_member_id == request.auth.uid &&
       request.resource.data.title == resource.data.title &&
       request.resource.data.type == resource.data.type &&
       request.resource.data.family_id == resource.data.family_id)
    ) && isValidTaskData(request.resource.data);
    allow delete: if isAuthenticated() && isParentInFamily(family_id);
  }

  // Evidence サブコレクション
  match /evidence/{evidence_id} {
    allow read: if isAuthenticated() && isFamilyMember(family_id);
    allow create: if isAuthenticated() &&
                  isChildInFamily(family_id) &&
                  request.resource.data.child_member_id == request.auth.uid &&
                  request.resource.data.family_id == family_id &&
                  isValidEvidenceData(request.resource.data);
    allow update: if false; // Evidenceは不変 (Immutable)
    allow delete: if isAuthenticated() && (
      isParentInFamily(family_id) ||
      // Child: 自分のEvidenceのみ削除可
      (isChildInFamily(family_id) &&
       resource.data.child_member_id == request.auth.uid)
    );
  }

  // Recommendations サブコレクション
  match /recommendations/{recommend_id} {
    allow read: if isAuthenticated() && isFamilyMember(family_id) && (
      isParentInFamily(family_id) ||
      // Child: 自分宛のRecommendationのみ閲覧可
      resource.data.target_member_id == request.auth.uid
    );
    allow create: if isAuthenticated() &&
                  isParentInFamily(family_id) &&
                  request.resource.data.family_id == family_id &&
                  isValidRecommendationData(request.resource.data);
    allow update: if isAuthenticated() && isParentInFamily(family_id);
    allow delete: if isAuthenticated() && isParentInFamily(family_id);
  }
}

// データバリデーション関数
function isValidMemberData(data) {
  return data.keys().hasAll(['member_id', 'family_id', 'role', 'display_name']) &&
         data.role in ['parent', 'child'] &&
         data.display_name is string && data.display_name.size() > 0 &&
         data.display_name.size() <= 50;
}

function isValidEvidenceData(data) {
  return data.keys().hasAll(['evidence_id', 'family_id', 'child_member_id', 'kind']) &&
         data.kind in ['photo', 'voice', 'note'] &&
         (data.text == null || (data.text is string && data.text.size() <= 1000));
}

function isValidRecommendationData(data) {
  return data.keys().hasAll(['recommend_id', 'family_id', 'target_member_id', 'kind', 'title']) &&
         data.kind in ['question', 'book', 'place'] &&
         data.title is string && data.title.size() > 0 && data.title.size() <= 200;
}
```

### Firebase Storage Security Rules

```javascript
// backend/storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // families/配下のファイルアクセス制御
    match /families/{family_id}/evidence/{evidence_id}/{fileName} {
      // 読み取り: Family内メンバーのみ
      allow read: if request.auth != null &&
                  isFamilyMemberInStorage(family_id);

      // 書き込み: Child権限かつ厳格な制限
      allow write: if request.auth != null &&
                   isChildInFamilyInStorage(family_id) &&
                   // ファイルサイズ制限 (50MB)
                   request.resource.size < 50 * 1024 * 1024 &&
                   // MIMEタイプ制限
                   isAllowedFileType(request.resource.contentType) &&
                   // ファイル名制限 (セキュリティ)
                   isSecureFileName(fileName);
    }

    // バックアップファイル (将来拡張)
    match /families/{family_id}/backups/{backup_id}/{fileName} {
      allow read: if request.auth != null &&
                  isParentInFamilyInStorage(family_id);
      allow write: if request.auth != null &&
                   isParentInFamilyInStorage(family_id) &&
                   request.resource.size < 100 * 1024 * 1024; // 100MB
    }

    // その他のパスは全て拒否
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

// Storage用のヘルパー関数
function isFamilyMemberInStorage(familyId) {
  return firestore.exists(/databases/(default)/documents/families/$(familyId)/members/$(request.auth.uid));
}

function isChildInFamilyInStorage(familyId) {
  let memberDoc = firestore.get(/databases/(default)/documents/families/$(familyId)/members/$(request.auth.uid));
  return memberDoc.data.role == 'child';
}

function isParentInFamilyInStorage(familyId) {
  let memberDoc = firestore.get(/databases/(default)/documents/families/$(familyId)/members/$(request.auth.uid));
  return memberDoc.data.role == 'parent';
}

function isAllowedFileType(contentType) {
  return contentType.matches('image/(jpeg|png|webp)') ||
         contentType.matches('audio/(mp3|wav|webm)') ||
         contentType.matches('video/(mp4|webm)');
}

function isSecureFileName(fileName) {
  // 危険な文字・パスを拒否
  return !fileName.matches('.*[<>:"|?*\\\\].*') &&
         !fileName.matches('.*(\\.\\.|\\/|\\\\).*') &&
         fileName.size() <= 255;
}
```

### Firebase Auth設定 (分離アーキテクチャ対応)

#### 認証プロバイダー制限
```typescript
// backend/functions/src/config/authConfig.ts
interface AuthConfig {
  // 許可する認証方法
  allowedProviders: string[];
  // パスワードポリシー
  passwordPolicy: PasswordPolicy;
  // セッション管理
  sessionConfig: SessionConfig;
}

const authConfig: AuthConfig = {
  allowedProviders: [
    'email',     // Email/Password認証 (主要)
    'anonymous'  // 匿名認証 (初回利用時の一時的利用のみ)
  ],

  // 禁止する認証方法の理由:
  // - Google OAuth: プライバシー保護・データ最小化の原則
  // - SNS連携: 外部依存性・セキュリティリスク軽減
  // - 電話番号: コスト・国際対応の複雑性

  passwordPolicy: {
    minLength: 8,              // 最小8文字
    maxLength: 128,            // 最大128文字
    requireUppercase: true,    // 大文字必須
    requireLowercase: true,    // 小文字必須
    requireNumbers: true,      // 数字必須
    requireSymbols: false,     // 記号は任意 (使いやすさ優先)
    disallowCommonPasswords: true,  // 一般的なパスワード禁止
    disallowPersonalInfo: true      // 個人情報含有パスワード禁止
  },

  sessionConfig: {
    sessionTimeout: 24 * 60 * 60 * 1000,    // 24時間
    refreshTokenLifetime: 7 * 24 * 60 * 60 * 1000, // 7日間
    maxConcurrentSessions: 5,  // 同時セッション数制限
    requireReauthForSensitive: true // 機密操作での再認証必須
  }
};
```

#### Backend認証検証
```typescript
// backend/functions/src/middleware/authValidation.ts
export class AuthValidationService {

  // JWT Token完全性検証
  static async validateTokenIntegrity(token: string): Promise<boolean> {
    try {
      const decodedToken = await getAuth().verifyIdToken(token, true);

      // Token発行者検証
      if (decodedToken.iss !== `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`) {
        return false;
      }

      // Audience検証
      if (decodedToken.aud !== process.env.FIREBASE_PROJECT_ID) {
        return false;
      }

      // Token有効期限検証
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < now || decodedToken.iat > now) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // セッション有効性検証
  static async validateUserSession(uid: string): Promise<boolean> {
    try {
      // Firebase Authユーザー状態確認
      const userRecord = await getAuth().getUser(uid);

      // アカウント無効化チェック
      if (userRecord.disabled) {
        return false;
      }

      // メール認証チェック (必要に応じて)
      if (!userRecord.emailVerified && userRecord.providerData.length > 0) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## データ保護・プライバシー (モノレポ対応)

### 個人情報保護戦略

#### データ分類・ライフサイクル管理
```typescript
// shared/types/privacy.ts - Frontend/Backend共通
export enum PersonalDataLevel {
  PUBLIC = 'public',           // 公開可能 (表示名等)
  FAMILY_INTERNAL = 'family',  // Family内共有 (タスク、証拠等)
  PERSONAL = 'personal',       // 個人専用 (認証情報等)
  SENSITIVE = 'sensitive'      // 機密 (生年月日、位置情報等)
}

// データ保存期間ポリシー
export const dataRetentionPolicy = {
  // アプリケーションデータ
  tasks: 5 * 365 * 24 * 60 * 60 * 1000,        // 5年 (学習記録として長期保存)
  evidence: 5 * 365 * 24 * 60 * 60 * 1000,     // 5年 (成長記録として長期保存)
  recommendations: 3 * 365 * 24 * 60 * 60 * 1000, // 3年 (推奨データ)

  // システムログ
  auth_logs: 365 * 24 * 60 * 60 * 1000,        // 1年 (認証ログ)
  activity_logs: 180 * 24 * 60 * 60 * 1000,    // 6ヶ月 (アクティビティログ)
  error_logs: 90 * 24 * 60 * 60 * 1000,        // 3ヶ月 (エラーログ)

  // 一時データ
  upload_temp_files: 24 * 60 * 60 * 1000,      // 24時間 (一時アップロードファイル)
  session_cache: 60 * 60 * 1000,               // 1時間 (セッションキャッシュ)

  // バックアップ
  encrypted_backups: 7 * 365 * 24 * 60 * 60 * 1000 // 7年 (法的要件対応)
};

// Frontend: ローカルキャッシュ期間
export const frontendCachePolicy = {
  taskCache: 7 * 24 * 60 * 60 * 1000,          // 7日間
  evidenceMetadata: 30 * 24 * 60 * 60 * 1000,  // 30日間
  userProfile: 24 * 60 * 60 * 1000,            // 24時間
  apiTokenCache: 50 * 60 * 1000                // 50分間 (Tokenの自動更新前)
};
```

#### データ暗号化戦略
```typescript
// Frontend暗号化 (Dexieローカルストレージ)
export class FrontendEncryption {
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  // 機密データのローカル暗号化
  static async encryptSensitiveData(data: any, userKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    // 暗号化キー生成
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ENCRYPTION_ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    // 暗号化実行
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ENCRYPTION_ALGORITHM, iv: iv },
      key,
      dataBuffer
    );

    // 結果の結合・エンコード
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }
}

// Backend暗号化 (Firestore + Storage)
export class BackendEncryption {
  // ファイル暗号化 (Firebase Storageアップロード前)
  static async encryptFile(fileBuffer: Buffer, familyKey: string): Promise<Buffer> {
    // AES-256-GCMでファイル暗号化
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(familyKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key, { iv });
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // IV + AuthTag + 暗号化データを結合
    return Buffer.concat([iv, authTag, encrypted]);
  }

  // 機密フィールドの暗号化 (Firestore保存前)
  static encryptSensitiveFields(document: any): any {
    const sensitiveFields = ['birth_year', 'member_code', 'personal_notes'];
    const encrypted = { ...document };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encryptFieldValue(encrypted[field]);
      }
    }

    return encrypted;
  }
}
```

#### プライバシー・バイ・デザイン実装
```typescript
// Frontend: プライバシー設定管理
export class PrivacyController {
  // ユーザー同意状態管理
  static async getUserConsent(): Promise<ConsentStatus> {
    const consent = await this.getStoredConsent();
    return {
      serviceTerms: consent.serviceTerms || false,
      privacyPolicy: consent.privacyPolicy || false,
      dataProcessing: consent.dataProcessing || false,
      analytics: consent.analytics || false, // 任意項目
      marketing: consent.marketing || false  // 任意項目
    };
  }

  // データエクスポート機能 (ポータビリティ権)
  static async exportUserData(familyId: string): Promise<ExportData> {
    const apiClient = new SecureApiClient();

    // Backend APIからデータ取得
    const exportData = await apiClient.get<ExportData>(
      `/api/families/${familyId}/export`
    );

    // JSON形式でダウンロード用ファイル生成
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return exportData;
  }

  // データ削除機能 (削除権)
  static async deleteUserData(familyId: string, memberIds: string[]): Promise<void> {
    const apiClient = new SecureApiClient();

    // 段階的削除実行
    await apiClient.delete(`/api/families/${familyId}/members/batch`, {
      memberIds,
      deletionType: 'complete' // 'anonymize' | 'complete'
    });
  }
}

// Backend: データ削除・匿名化サービス
export class DataDeletionService {
  // GDPR準拠データ削除
  static async deleteUserDataCompletely(familyId: string, memberIds: string[]): Promise<void> {
    const batch = getFirestore().batch();

    // 1. Firestore データ削除
    for (const memberId of memberIds) {
      // Member自体
      const memberRef = getFirestore()
        .collection('families')
        .doc(familyId)
        .collection('members')
        .doc(memberId);
      batch.delete(memberRef);

      // 関連Task削除
      const tasks = await getFirestore()
        .collection('families')
        .doc(familyId)
        .collection('tasks')
        .where('assignee_member_id', '==', memberId)
        .get();

      tasks.docs.forEach(doc => batch.delete(doc.ref));

      // 関連Evidence削除
      const evidence = await getFirestore()
        .collection('families')
        .doc(familyId)
        .collection('evidence')
        .where('child_member_id', '==', memberId)
        .get();

      evidence.docs.forEach(doc => batch.delete(doc.ref));
    }

    await batch.commit();

    // 2. Firebase Storage ファイル削除
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({
      prefix: `families/${familyId}/evidence/`
    });

    for (const file of files) {
      await file.delete();
    }

    // 3. 削除ログ記録
    await this.logDataDeletion(familyId, memberIds, 'complete');
  }

  // データ匿名化 (統計目的保持)
  static async anonymizeUserData(familyId: string, memberIds: string[]): Promise<void> {
    // Task, Evidenceは匿名化して統計用に保持
    // Member情報のみ削除
  }
}
```

## アプリケーション制約 (モノレポ対応)

### Frontend制約

#### パフォーマンス制約
```typescript
// frontend/src/config/constraints.ts
export const frontendConstraints = {
  // UI制約
  maxConcurrentApiCalls: 5,        // 同時API呼び出し数
  apiTimeout: 10000,               // APIタイムアウト (10秒)
  retryAttempts: 3,                // API失敗時リトライ回数

  // ローカルキャッシュ制約
  maxDexieDbSize: 50 * 1024 * 1024,  // 50MB (Dexie)
  maxCachedTasks: 1000,            // キャッシュタスク数
  maxCachedEvidence: 500,          // キャッシュ証拠数

  // ファイルアップロード制約
  maxFileSize: 50 * 1024 * 1024,   // 50MB
  maxConcurrentUploads: 3,         // 同時アップロード数
  uploadChunkSize: 5 * 1024 * 1024, // 5MB (チャンク分割)

  // UI制約
  maxListItemsDisplayed: 100,      // 一度に表示する項目数
  virtualScrollThreshold: 50,      // 仮想スクロール閾値
  debounceDelay: 300,              // 検索デバウンス (ms)

  // セキュリティ制約
  maxInputLength: {
    taskTitle: 200,
    evidenceText: 1000,
    memberName: 50,
    recommendationTitle: 200
  }
};
```

### Backend制約

#### Firebase Functions制約
```typescript
// backend/functions/src/config/constraints.ts
export const backendConstraints = {
  // Firebase Functions制約
  functionTimeout: 540000,         // 9分 (最大)
  maxMemory: '1GB',               // メモリ上限
  maxConcurrentExecutions: 1000,   // 同時実行数

  // Firestore制約
  firestore: {
    // ドキュメント制約
    maxDocumentSize: 1048576,      // 1MB
    maxFieldsPerDocument: 20000,   // 20,000フィールド
    maxArrayElements: 20000,       // 20,000要素
    maxDocumentDepth: 100,         // ネスト階層

    // クエリ制約
    maxCompositeIndexes: 200,      // 複合インデックス
    maxFieldsPerIndex: 100,        // インデックスあたりフィールド数
    maxQueriesPerSecond: 10000,    // 秒間クエリ数
    maxQueryResults: 1000,         // クエリ結果数上限

    // アプリケーション制約
    maxTasksPerFamily: 10000,      // Family当たりタスク数
    maxEvidencePerChild: 5000,     // Child当たり証拠数
    maxMembersPerFamily: 50,       // Family当たりメンバー数
    maxRecommendationsPerChild: 100 // Child当たり推奨数
  },

  // Firebase Storage制約
  storage: {
    maxFileSize: 50 * 1024 * 1024,   // 50MB (1ファイル)
    maxTotalStorage: 1073741824,     // 1GB (Family当たり)
    maxFilesPerEvidence: 5,          // Evidence当たりファイル数
    uploadTimeout: 300000,           // アップロードタイムアウト (5分)

    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp',
      'audio/mp3', 'audio/wav', 'audio/webm',
      'video/mp4', 'video/webm'
    ],

    maxFilenameLength: 255,
    forbiddenFilenamePatterns: [
      /[<>:"|?*\\]/,          // Windows無効文字
      /^(CON|PRN|AUX|NUL)/i,   // Windows予約語
      /\.\./, /\//, /\\/      // パストラバーサル
    ]
  }
};
```

#### API制約・レート制限
```typescript
// backend/functions/src/middleware/rateLimiter.ts
export const apiConstraints = {
  // API呼び出し制限 (ユーザー毎)
  rateLimits: {
    // 一般API制限
    general: {
      windowMs: 60 * 1000,       // 1分間
      max: 100,                  // 100リクエスト/分
      message: 'Too many requests, please try again later'
    },

    // 認証API制限
    auth: {
      windowMs: 60 * 60 * 1000,  // 1時間
      max: 10,                   // 10リクエスト/時間
      message: 'Too many authentication attempts'
    },

    // ファイルアップロード制限
    upload: {
      windowMs: 60 * 60 * 1000,  // 1時間
      max: 50,                   // 50ファイル/時間
      message: 'Upload limit exceeded'
    },

    // データエクスポート制限
    export: {
      windowMs: 24 * 60 * 60 * 1000,  // 24時間
      max: 5,                         // 5回/日
      message: 'Export limit exceeded'
    }
  },

  // ビジネスロジック制約
  business: {
    // Task作成制限
    maxTasksPerHour: 100,        // 1時間当たりTask作成数
    maxTasksPerDay: 500,         // 1日当たりTask作成数

    // Evidence制限
    maxEvidencePerHour: 50,      // 1時間当たりEvidence作成数
    maxEvidencePerDay: 200,      // 1日当たりEvidence作成数

    // Member制限
    maxMemberInvitesPerDay: 10,  // 1日当たり招待数
    maxFamilyCreationsPerDay: 3, // 1日当たりFamily作成数

    // データ取得制限
    maxQueryPageSize: 100,       // ページング最大サイズ
    maxQueryDepth: 5,            // クエリネスト深度
    maxBatchOperations: 500      // バッチ操作最大数
  }
};

// レート制限実装
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(userId: string, operation: string): Promise<boolean> {
    const limit = apiConstraints.rateLimits[operation];
    if (!limit) return true;

    const key = `${userId}:${operation}`;
    const now = Date.now();
    const existing = this.limits.get(key);

    if (!existing || now > existing.resetTime) {
      // 新しいウィンドウまたは期限切れ
      this.limits.set(key, {
        count: 1,
        resetTime: now + limit.windowMs
      });
      return true;
    }

    if (existing.count >= limit.max) {
      return false; // 制限超過
    }

    existing.count++;
    return true;
  }
}
```

### セキュリティ制約 (多層防御)

#### 入力バリデーション制約
```typescript
// backend/functions/src/validation/securityValidation.ts
export class SecurityValidation {
  // SQLインジェクション対策
  static validateInput(input: string, type: 'text' | 'number' | 'email'): ValidationResult {
    // 基本的な危険パターンチェック
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,  // Script tags
      /javascript:/gi,                  // JavaScript protocol
      /on\w+\s*=/gi,                   // Event handlers
      /\bUNION\b.*\bSELECT\b/gi,       // SQL injection
      /\bDROP\b.*\bTABLE\b/gi,         // SQL injection
      /\bINSERT\b.*\bINTO\b/gi,        // SQL injection
      /\bDELETE\b.*\bFROM\b/gi,        // SQL injection
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g // Control characters
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return {
          valid: false,
          error: 'Input contains potentially dangerous content',
          errorCode: 'DANGEROUS_INPUT'
        };
      }
    }

    // 型固有バリデーション
    switch (type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          return { valid: false, error: 'Invalid email format' };
        }
        break;
      case 'number':
        if (!/^-?\d+(\.\d+)?$/.test(input)) {
          return { valid: false, error: 'Invalid number format' };
        }
        break;
    }

    return { valid: true };
  }

  // ファイルアップロードセキュリティ
  static validateFileUpload(file: Express.Multer.File): ValidationResult {
    // Magic number検証 (MIMEタイプ偽装対策)
    const mimeTypeValidation = this.validateMimeType(file.buffer, file.mimetype);
    if (!mimeTypeValidation.valid) {
      return mimeTypeValidation;
    }

    // ファイル名セキュリティチェック
    if (this.containsDangerousPath(file.originalname)) {
      return {
        valid: false,
        error: 'Filename contains dangerous characters',
        errorCode: 'DANGEROUS_FILENAME'
      };
    }

    // ファイルサイズチェック
    if (file.size > backendConstraints.storage.maxFileSize) {
      return {
        valid: false,
        error: 'File size exceeds limit',
        errorCode: 'FILE_TOO_LARGE'
      };
    }

    return { valid: true };
  }

  private static validateMimeType(buffer: Buffer, declaredMimeType: string): ValidationResult {
    // PNG signature
    if (declaredMimeType === 'image/png') {
      if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
        return { valid: false, error: 'PNG signature mismatch' };
      }
    }

    // JPEG signature
    if (declaredMimeType === 'image/jpeg') {
      if (!(buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF)) {
        return { valid: false, error: 'JPEG signature mismatch' };
      }
    }

    return { valid: true };
  }

  private static containsDangerousPath(filename: string): boolean {
    const dangerousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*\\]/, // Windows invalid chars
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /\x00/, // Null bytes
      /^\s/, /\s$/ // Leading/trailing whitespace
    ];

    return dangerousPatterns.some(pattern => pattern.test(filename));
  }
}
```

#### セッション管理・異常検知
```typescript
// backend/functions/src/security/sessionManager.ts
export class SessionManager {
  private static readonly SESSION_CONFIG = {
    // セッション有効期限
    webSessionDuration: 24 * 60 * 60 * 1000,      // 24時間 (Web)
    mobileSessionDuration: 7 * 24 * 60 * 60 * 1000, // 7日間 (Mobile)

    // セッション制御
    maxConcurrentSessions: 5,        // 同時セッション数
    sessionRefreshThreshold: 60 * 60 * 1000, // リフレッシュ閾値 (1時間)

    // セキュリティ設定
    requireReauthForSensitive: true,  // 機密操作時の再認証
    logoutOnSuspiciousActivity: true, // 不審なアクティビティでの強制ログアウト
    sessionIdRotationInterval: 30 * 60 * 1000 // セッションID更新間隔 (30分)
  };

  // 異常なアクティビティ検知
  static async detectSuspiciousActivity(
    userId: string,
    request: AuthenticatedRequest
  ): Promise<{ suspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // 1. 地理的位置の急激な変化検知
    const lastLocation = await this.getLastKnownLocation(userId);
    const currentLocation = await this.getLocationFromIP(request.ip);

    if (lastLocation && currentLocation) {
      const distance = this.calculateDistance(lastLocation, currentLocation);
      const timeDiff = Date.now() - lastLocation.timestamp;

      // 物理的に不可能な移動速度チェック
      if (distance > 1000 && timeDiff < 2 * 60 * 60 * 1000) { // 1000km in 2h
        reasons.push('Impossible travel speed detected');
      }
    }

    // 2. User-Agentの突然の変更
    const lastUserAgent = await this.getLastUserAgent(userId);
    if (lastUserAgent && lastUserAgent !== request.headers['user-agent']) {
      reasons.push('User-Agent changed unexpectedly');
    }

    // 3. 異常なAPI呼び出しパターン
    const recentActivity = await this.getRecentActivity(userId, 10 * 60 * 1000); // 10分間
    if (recentActivity.length > 100) { // 10分で100回以上のAPI呼び出し
      reasons.push('Unusually high API activity');
    }

    // 4. 複数デバイスからの同時ログイン
    const activeSessions = await this.getActiveSessions(userId);
    if (activeSessions.length > this.SESSION_CONFIG.maxConcurrentSessions) {
      reasons.push('Too many concurrent sessions');
    }

    // 5. 権限昇格試行の検知
    const privilegeEscalationAttempts = await this.detectPrivilegeEscalation(userId);
    if (privilegeEscalationAttempts > 0) {
      reasons.push('Privilege escalation attempts detected');
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }

  // セッション無効化 (セキュリティインシデント時)
  static async invalidateAllUserSessions(userId: string, reason: string): Promise<void> {
    // Firebase Auth: すべてのリフレッシュトークンを無効化
    await getAuth().revokeRefreshTokens(userId);

    // アプリケーション側セッション無効化
    await this.clearUserSessions(userId);

    // セキュリティログ記録
    await SecurityLogger.log('SESSION_INVALIDATED', {
      userId,
      reason,
      timestamp: new Date().toISOString(),
      invalidatedSessions: await this.getActiveSessions(userId)
    });
  }

  private static calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(loc2.lat - loc1.lat);
    const dLng = this.deg2rad(loc2.lng - loc1.lng);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
```

## エラーハンドリング・ログ (モノレポ対応)

### エラーカテゴリ定義 (Frontend/Backend共通)

```typescript
// shared/types/errors.ts
// セキュリティエラー
export enum SecurityErrorType {
  // 認証関連
  UNAUTHORIZED = 'UNAUTHORIZED',                 // 認証エラー
  FORBIDDEN = 'FORBIDDEN',                      // 認可エラー
  INVALID_TOKEN = 'INVALID_TOKEN',              // トークンエラー
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',              // トークン期限切れ
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',   // 認証情報無効

  // アクセス制御
  FAMILY_BOUNDARY_VIOLATION = 'FAMILY_BOUNDARY_VIOLATION', // Family境界違反
  ROLE_PERMISSION_DENIED = 'ROLE_PERMISSION_DENIED',       // ロール権限拒否

  // レート制限・悪用対策
  RATE_LIMITED = 'RATE_LIMITED',                // レート制限
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',   // 不審なアクティビティ
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED', // ブルートフォース攻撃

  // 入力セキュリティ
  DANGEROUS_INPUT = 'DANGEROUS_INPUT',          // 危険な入力
  FILE_SECURITY_VIOLATION = 'FILE_SECURITY_VIOLATION', // ファイルセキュリティ違反
  XSS_ATTEMPT = 'XSS_ATTEMPT',                 // XSS試行
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT' // SQLインジェクション試行
}

// データエラー
export enum DataErrorType {
  // バリデーション
  VALIDATION_FAILED = 'VALIDATION_FAILED',     // バリデーションエラー
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION', // 制約違反
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',         // スキーマ不一致

  // データ整合性
  DATA_CORRUPTION = 'DATA_CORRUPTION',         // データ破損
  REFERENCE_INTEGRITY_ERROR = 'REFERENCE_INTEGRITY_ERROR', // 参照整合性エラー
  DUPLICATE_KEY_ERROR = 'DUPLICATE_KEY_ERROR', // 重複キーエラー

  // 同期・競合
  SYNC_CONFLICT = 'SYNC_CONFLICT',             // 同期競合
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION', // 同時変更
  STALE_DATA = 'STALE_DATA'                    // 古いデータ
}

// システムエラー
export enum SystemErrorType {
  // インフラ
  INTERNAL_ERROR = 'INTERNAL_ERROR',           // 内部エラー
  DATABASE_ERROR = 'DATABASE_ERROR',           // データベースエラー
  STORAGE_ERROR = 'STORAGE_ERROR',             // ストレージエラー
  NETWORK_ERROR = 'NETWORK_ERROR',             // ネットワークエラー

  // 外部依存
  FIREBASE_ERROR = 'FIREBASE_ERROR',           // Firebaseエラー
  THIRD_PARTY_ERROR = 'THIRD_PARTY_ERROR',     // 外部サービスエラー

  // リソース
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',   // リソース枯渇
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',           // クォータ超過
  TIMEOUT = 'TIMEOUT'                          // タイムアウト
}
```

### セキュリティログ実装
```typescript
// backend/functions/src/security/securityLogger.ts
export class SecurityLogger {
  private static readonly LOG_LEVELS = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    INFO: 4
  };

  // セキュリティイベントログ
  static async logSecurityEvent(
    eventType: SecurityErrorType,
    details: SecurityEventDetails
  ): Promise<void> {
    const logEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      severity: this.determineSeverity(eventType),
      userId: details.userId,
      familyId: details.familyId,
      ip: this.maskIP(details.ip),
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      description: details.description,
      metadata: this.sanitizeMetadata(details.metadata),
      requestId: details.requestId
    };

    // Firestore セキュリティログ保存
    await getFirestore()
      .collection('security_logs')
      .add(logEntry);

    // 重大なセキュリティイベントの場合、アラート送信
    if (logEntry.severity <= this.LOG_LEVELS.HIGH) {
      await this.sendSecurityAlert(logEntry);
    }

    // Cloud Logging出力
    console.log(JSON.stringify({
      severity: Object.keys(this.LOG_LEVELS)[logEntry.severity],
      message: `Security Event: ${eventType}`,
      ...logEntry
    }));
  }

  // 異常アクティビティ集約分析
  static async analyzeSecurityPatterns(userId: string): Promise<SecurityAnalysis> {
    const recentLogs = await getFirestore()
      .collection('security_logs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .orderBy('timestamp', 'desc')
      .get();

    const logs = recentLogs.docs.map(doc => doc.data() as SecurityLogEntry);

    return {
      totalEvents: logs.length,
      criticalEvents: logs.filter(log => log.severity === this.LOG_LEVELS.CRITICAL).length,
      suspiciousPatterns: this.detectPatterns(logs),
      riskScore: this.calculateRiskScore(logs),
      recommendations: this.generateRecommendations(logs)
    };
  }

  private static determineSeverity(eventType: SecurityErrorType): number {
    const severityMap: Record<SecurityErrorType, number> = {
      [SecurityErrorType.BRUTE_FORCE_DETECTED]: this.LOG_LEVELS.CRITICAL,
      [SecurityErrorType.FAMILY_BOUNDARY_VIOLATION]: this.LOG_LEVELS.CRITICAL,
      [SecurityErrorType.SQL_INJECTION_ATTEMPT]: this.LOG_LEVELS.CRITICAL,
      [SecurityErrorType.XSS_ATTEMPT]: this.LOG_LEVELS.HIGH,
      [SecurityErrorType.SUSPICIOUS_ACTIVITY]: this.LOG_LEVELS.HIGH,
      [SecurityErrorType.DANGEROUS_INPUT]: this.LOG_LEVELS.MEDIUM,
      [SecurityErrorType.RATE_LIMITED]: this.LOG_LEVELS.MEDIUM,
      [SecurityErrorType.UNAUTHORIZED]: this.LOG_LEVELS.LOW,
      [SecurityErrorType.FORBIDDEN]: this.LOG_LEVELS.LOW,
      [SecurityErrorType.INVALID_TOKEN]: this.LOG_LEVELS.LOW,
      [SecurityErrorType.TOKEN_EXPIRED]: this.LOG_LEVELS.INFO,
      [SecurityErrorType.INVALID_CREDENTIALS]: this.LOG_LEVELS.LOW,
      [SecurityErrorType.ROLE_PERMISSION_DENIED]: this.LOG_LEVELS.LOW,
      [SecurityErrorType.FILE_SECURITY_VIOLATION]: this.LOG_LEVELS.MEDIUM
    };

    return severityMap[eventType] ?? this.LOG_LEVELS.MEDIUM;
  }

  private static maskIP(ip: string): string {
    // IPv4: 最後のオクテットをマスク
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[3] = 'xxx';
      return parts.join('.');
    }

    // IPv6: 後半をマスク
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::xxxx:xxxx:xxxx:xxxx';
    }

    return 'masked';
  }

  private static sanitizeMetadata(metadata: any): any {
    if (!metadata) return null;

    // 機密情報を除去
    const sanitized = { ...metadata };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

interface SecurityEventDetails {
  userId?: string;
  familyId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  description: string;
  metadata?: any;
  requestId?: string;
}

interface SecurityLogEntry {
  timestamp: string;
  eventType: SecurityErrorType;
  severity: number;
  userId?: string;
  familyId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  description: string;
  metadata?: any;
  requestId?: string;
}
```

### ログ記録ポリシー (モノレポ対応)

#### 必須ログ項目・分類
```typescript
// shared/types/logging.ts
export interface LoggingPolicy {
  // Frontend必須ログ項目
  frontend: {
    userActions: boolean;          // ユーザーアクション (クリック、ナビゲーション)
    apiCalls: boolean;             // API呼び出し (成功・失敗)
    errors: boolean;               // JavaScript エラー・例外
    performance: boolean;          // パフォーマンス メトリクス
    securityEvents: boolean;       // セキュリティ関連イベント
  };

  // Backend必須ログ項目
  backend: {
    authentication: boolean;       // 認証・認可イベント (成功・失敗)
    dataOperations: boolean;       // データ作成・更新・削除イベント
    fileOperations: boolean;       // ファイルアップロード・ダウンロードイベント
    securityEvents: boolean;       // セキュリティエラー・警告
    systemErrors: boolean;         // システムエラー・例外
    apiAccess: boolean;           // API アクセスログ
    performanceMetrics: boolean;   // パフォーマンス メトリクス
  };
}

export const loggingPolicy: LoggingPolicy = {
  frontend: {
    userActions: true,
    apiCalls: true,
    errors: true,
    performance: true,
    securityEvents: true
  },
  backend: {
    authentication: true,
    dataOperations: true,
    fileOperations: true,
    securityEvents: true,
    systemErrors: true,
    apiAccess: true,
    performanceMetrics: true
  }
};
```

#### ログ保存・管理戦略
```typescript
// backend/functions/src/logging/logManager.ts
export class LogManager {
  private static readonly RETENTION_POLICY = {
    // セキュリティ・監査ログ (長期保存)
    securityLogs: 7 * 365 * 24 * 60 * 60 * 1000,      // 7年 (法的要件)
    auditLogs: 7 * 365 * 24 * 60 * 60 * 1000,         // 7年 (コンプライアンス)
    authLogs: 2 * 365 * 24 * 60 * 60 * 1000,          // 2年 (認証ログ)

    // アプリケーションログ (中期保存)
    errorLogs: 365 * 24 * 60 * 60 * 1000,             // 1年 (エラーログ)
    performanceLogs: 90 * 24 * 60 * 60 * 1000,        // 3ヶ月 (パフォーマンス)
    apiAccessLogs: 90 * 24 * 60 * 60 * 1000,          // 3ヶ月 (APIアクセス)

    // デバッグ・一時ログ (短期保存)
    debugLogs: 7 * 24 * 60 * 60 * 1000,               // 7日 (デバッグ)
    temporaryLogs: 24 * 60 * 60 * 1000                // 24時間 (一時ログ)
  };

  // 個人情報マスキング
  static maskPersonalInfo(logData: any): any {
    const masked = { ...logData };

    // 自動マスキング対象フィールド
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'credential',
      'email', 'phone', 'birth_year', 'real_name',
      'ip_address', 'device_id', 'session_id'
    ];

    const maskField = (obj: any, fieldPath: string[]) => {
      if (fieldPath.length === 1) {
        const field = fieldPath[0];
        if (obj[field]) {
          if (typeof obj[field] === 'string') {
            // 部分マスキング (最初と最後の文字以外を隠す)
            const value = obj[field];
            if (value.length <= 2) {
              obj[field] = '*'.repeat(value.length);
            } else {
              obj[field] = value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
            }
          } else {
            obj[field] = '[MASKED]';
          }
        }
      } else {
        const [first, ...rest] = fieldPath;
        if (obj[first] && typeof obj[first] === 'object') {
          maskField(obj[first], rest);
        }
      }
    };

    // フィールドマスキング実行
    for (const field of sensitiveFields) {
      if (field.includes('.')) {
        maskField(masked, field.split('.'));
      } else {
        maskField(masked, [field]);
      }
    }

    return masked;
  }

  // 構造化ログ出力
  static async writeStructuredLog(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    category: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: metadata ? this.maskPersonalInfo(metadata) : null,
      service: 'homelog-backend',
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      requestId: metadata?.requestId || null
    };

    // Cloud Logging出力 (構造化ログ)
    console.log(JSON.stringify(logEntry));

    // Firestore保存 (必要に応じて)
    if (level === 'ERROR' || level === 'CRITICAL' || category === 'security') {
      await getFirestore()
        .collection('application_logs')
        .add({
          ...logEntry,
          retention_until: new Date(Date.now() + this.getRetentionPeriod(category))
        });
    }
  }

  private static getRetentionPeriod(category: string): number {
    switch (category) {
      case 'security':
      case 'audit':
        return this.RETENTION_POLICY.securityLogs;
      case 'auth':
        return this.RETENTION_POLICY.authLogs;
      case 'error':
        return this.RETENTION_POLICY.errorLogs;
      case 'performance':
        return this.RETENTION_POLICY.performanceLogs;
      case 'api':
        return this.RETENTION_POLICY.apiAccessLogs;
      default:
        return this.RETENTION_POLICY.debugLogs;
    }
  }
}
```

## 運用・監視制約 (モノレポ対応)

### 監視・アラート設定

#### Frontend監視項目
```typescript
// frontend/src/monitoring/clientMonitoring.ts
export class ClientMonitoring {
  // パフォーマンス監視
  static setupPerformanceMonitoring(): void {
    // Core Web Vitals監視
    this.monitorWebVitals();

    // API応答時間監視
    this.monitorApiResponseTimes();

    // バンドルサイズ監視
    this.monitorBundleSize();

    // メモリ使用量監視
    this.monitorMemoryUsage();
  }

  // セキュリティ監視
  static setupSecurityMonitoring(): void {
    // CSP違反監視
    document.addEventListener('securitypolicyviolation', (event) => {
      this.reportSecurityViolation('CSP_VIOLATION', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        originalPolicy: event.originalPolicy
      });
    });

    // 異常なJavaScriptエラー監視
    window.addEventListener('error', (event) => {
      if (this.isSuspiciousError(event.error)) {
        this.reportSecurityViolation('SUSPICIOUS_ERROR', {
          message: event.message,
          filename: event.filename,
          stack: event.error?.stack
        });
      }
    });
  }

  private static async reportSecurityViolation(type: string, details: any): Promise<void> {
    // Backend セキュリティエンドポイントに報告
    const apiClient = new SecureApiClient();
    await apiClient.post('/api/security/violations', {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
}
```

#### Backend監視項目
```typescript
// backend/functions/src/monitoring/serverMonitoring.ts
export class ServerMonitoring {
  private static readonly ALERT_THRESHOLDS = {
    // パフォーマンス閾値
    apiResponseTime: 2000,        // 2秒
    firestoreQueryTime: 1000,     // 1秒
    functionExecutionTime: 30000, // 30秒
    memoryUsagePercent: 80,       // 80%

    // エラー率閾値
    errorRatePercent: 5,          // 5%
    authFailureRatePercent: 10,   // 10%

    // セキュリティ閾値
    suspiciousActivityPerHour: 10, // 1時間あたり10件
    failedAuthAttemptsPerHour: 20, // 1時間あたり20件
    rateLimitViolationsPerHour: 50 // 1時間あたり50件
  };

  // パフォーマンス監視
  static setupPerformanceMonitoring(): void {
    // Firebase Functions パフォーマンス
    this.monitorFunctionPerformance();

    // Firestore クエリパフォーマンス
    this.monitorFirestorePerformance();

    // Storage使用量・転送量
    this.monitorStorageMetrics();

    // API エンドポイント監視
    this.monitorApiEndpoints();
  }

  // セキュリティ監視
  static setupSecurityMonitoring(): void {
    // 異常なAPI呼び出しパターン検出
    this.monitorAbnormalApiPatterns();

    // 認証失敗監視
    this.monitorAuthenticationFailures();

    // 権限昇格試行監視
    this.monitorPrivilegeEscalation();

    // 不審なアクティビティ検出
    this.monitorSuspiciousActivity();
  }

  private static async monitorAbnormalApiPatterns(): Promise<void> {
    // 過去1時間のAPI呼び出しパターン分析
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const apiLogs = await getFirestore()
      .collection('api_access_logs')
      .where('timestamp', '>=', oneHourAgo.toISOString())
      .get();

    // ユーザー別API呼び出し集計
    const userApiCounts = new Map<string, number>();
    const endpointCounts = new Map<string, number>();

    apiLogs.docs.forEach(doc => {
      const log = doc.data();
      userApiCounts.set(log.userId, (userApiCounts.get(log.userId) || 0) + 1);
      endpointCounts.set(log.endpoint, (endpointCounts.get(log.endpoint) || 0) + 1);
    });

    // 異常なパターン検出
    for (const [userId, count] of userApiCounts) {
      if (count > 1000) { // 1時間で1000回以上のAPI呼び出し
        await this.triggerSecurityAlert('ABNORMAL_API_USAGE', {
          userId,
          apiCallCount: count,
          timeWindow: '1hour'
        });
      }
    }
  }

  private static async triggerSecurityAlert(alertType: string, details: any): Promise<void> {
    const alert = {
      type: alertType,
      severity: this.determineSeverity(alertType),
      timestamp: new Date().toISOString(),
      details,
      environment: process.env.NODE_ENV
    };

    // Cloud Monitoring アラート
    console.error(JSON.stringify({
      severity: 'ERROR',
      message: `Security Alert: ${alertType}`,
      ...alert
    }));

    // Firestore アラートログ保存
    await getFirestore()
      .collection('security_alerts')
      .add(alert);

    // 重大なアラートの場合、外部通知
    if (alert.severity === 'CRITICAL') {
      await this.sendExternalAlert(alert);
    }
  }
}
```

### インシデント対応 (モノレポ対応)

#### 対応レベル定義・エスカレーション
```typescript
// backend/functions/src/security/incidentResponse.ts
export class IncidentResponse {
  private static readonly INCIDENT_LEVELS = {
    CRITICAL: {
      severity: 'CRITICAL',
      response: 15 * 60 * 1000,      // 15分以内の初動対応
      resolution: 4 * 60 * 60 * 1000, // 4時間以内の解決
      autoActions: ['isolateUser', 'invalidateSessions', 'blockIP'],
      notifications: ['email', 'slack', 'sms']
    },
    HIGH: {
      severity: 'HIGH',
      response: 60 * 60 * 1000,      // 1時間以内
      resolution: 24 * 60 * 60 * 1000, // 24時間以内
      autoActions: ['logSecurityEvent', 'increaseMonitoring'],
      notifications: ['email', 'slack']
    },
    MEDIUM: {
      severity: 'MEDIUM',
      response: 4 * 60 * 60 * 1000,  // 4時間以内
      resolution: 72 * 60 * 60 * 1000, // 72時間以内
      autoActions: ['logSecurityEvent'],
      notifications: ['email']
    },
    LOW: {
      severity: 'LOW',
      response: 24 * 60 * 60 * 1000, // 24時間以内
      resolution: 7 * 24 * 60 * 60 * 1000, // 1週間以内
      autoActions: ['logSecurityEvent'],
      notifications: ['dashboard']
    }
  };

  // インシデント自動対応
  static async handleSecurityIncident(
    incidentType: SecurityErrorType,
    details: any
  ): Promise<void> {
    const severity = this.classifyIncidentSeverity(incidentType, details);
    const level = this.INCIDENT_LEVELS[severity];

    // インシデント記録
    const incident = await this.createIncidentRecord(incidentType, severity, details);

    // 自動対応アクション実行
    await this.executeAutoActions(level.autoActions, incident, details);

    // 通知送信
    await this.sendNotifications(level.notifications, incident);

    // エスカレーション設定
    await this.scheduleEscalation(incident, level);
  }

  private static classifyIncidentSeverity(
    incidentType: SecurityErrorType,
    details: any
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // 重大インシデントの自動分類
    const criticalPatterns = [
      SecurityErrorType.FAMILY_BOUNDARY_VIOLATION,
      SecurityErrorType.SQL_INJECTION_ATTEMPT,
      SecurityErrorType.BRUTE_FORCE_DETECTED
    ];

    if (criticalPatterns.includes(incidentType)) {
      return 'CRITICAL';
    }

    // 複数の中程度インシデントは高リスク
    if (details.frequency && details.frequency > 10) {
      return 'HIGH';
    }

    // システム管理者アカウントの関与
    if (details.userRole === 'admin' || details.escalatedPrivileges) {
      return 'HIGH';
    }

    const highRiskPatterns = [
      SecurityErrorType.SUSPICIOUS_ACTIVITY,
      SecurityErrorType.XSS_ATTEMPT,
      SecurityErrorType.FILE_SECURITY_VIOLATION
    ];

    if (highRiskPatterns.includes(incidentType)) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  private static async executeAutoActions(
    actions: string[],
    incident: any,
    details: any
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action) {
          case 'isolateUser':
            if (details.userId) {
              await SessionManager.invalidateAllUserSessions(
                details.userId,
                `Security incident: ${incident.id}`
              );
              await this.temporarilyDisableUser(details.userId);
            }
            break;

          case 'invalidateSessions':
            if (details.userId) {
              await SessionManager.invalidateAllUserSessions(
                details.userId,
                `Security incident: ${incident.id}`
              );
            }
            break;

          case 'blockIP':
            if (details.ip) {
              await this.addToIPBlocklist(details.ip, incident.id);
            }
            break;

          case 'increaseMonitoring':
            await this.increaseMonitoringLevel(details.userId || details.familyId);
            break;

          case 'logSecurityEvent':
            await SecurityLogger.logSecurityEvent(incident.type, details);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute auto action ${action}:`, error);
      }
    }
  }

  // インシデント追跡・報告
  static async generateIncidentReport(incidentId: string): Promise<IncidentReport> {
    const incident = await this.getIncidentById(incidentId);
    const relatedLogs = await this.getRelatedSecurityLogs(incident);
    const timeline = await this.buildIncidentTimeline(incident, relatedLogs);

    return {
      incidentId: incident.id,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt,
      responseTime: incident.responseTime,
      resolutionTime: incident.resolutionTime,
      timeline,
      affectedUsers: await this.getAffectedUsers(incident),
      rootCause: incident.rootCause,
      remediation: incident.remediation,
      preventionMeasures: incident.preventionMeasures,
      lessonsLearned: incident.lessonsLearned
    };
  }
}

interface IncidentReport {
  incidentId: string;
  type: SecurityErrorType;
  severity: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  responseTime?: number;
  resolutionTime?: number;
  timeline: IncidentTimelineEntry[];
  affectedUsers: string[];
  rootCause?: string;
  remediation?: string;
  preventionMeasures?: string[];
  lessonsLearned?: string;
}
```

#### セキュリティインシデント対応手順 (モノレポ対応)

##### Phase 1: 検出・初動対応 (15分以内)
- [ ] 自動監視システムによるインシデント検出
- [ ] セキュリティアラート自動送信
- [ ] 初動対応チーム招集
- [ ] インシデント重要度分類・エスカレーション
- [ ] 必要に応じた自動対応措置実行
  - [ ] ユーザーセッション無効化
  - [ ] 疑わしいIPアドレスブロック
  - [ ] Family境界違反時の緊急アクセス制限

##### Phase 2: 影響範囲特定・封じ込め (1時間以内)
- [ ] 影響を受けたFamily・Userの特定
- [ ] データ漏洩・改ざんの有無確認
- [ ] Frontend/Backendの両方での影響範囲調査
- [ ] 攻撃ベクターの特定
- [ ] 追加的な封じ込め措置実施
- [ ] ステークホルダーへの初期報告

##### Phase 3: 詳細調査・根本原因分析 (24時間以内)
- [ ] セキュリティログの詳細分析
- [ ] Frontend/Backend/Firestore の全層での調査
- [ ] 攻撃手法・侵入経路の完全解明
- [ ] 影響を受けたデータの完全な特定
- [ ] フォレンジック証拠の保全
- [ ] 法的要件（個人情報保護法等）への対応検討

##### Phase 4: 復旧・恒久対策 (72時間以内)
- [ ] セキュリティホールの修正
- [ ] 影響を受けたシステムの安全な復旧
- [ ] データ整合性の検証・修復
- [ ] セキュリティ強化策の実装
- [ ] 監視・検知システムの改善
- [ ] インシデント対応手順の改善

##### Phase 5: 事後対応・再発防止 (1週間以内)
- [ ] 影響を受けたユーザーへの通知（法的要件に従い）
- [ ] 詳細なインシデントレポート作成
- [ ] 再発防止策の策定・実装
- [ ] セキュリティ教育・訓練の強化
- [ ] 第三者セキュリティ監査の実施検討
- [ ] インシデント対応プロセスの改善

##### 継続的改善
- [ ] 月次インシデントレビュー会議
- [ ] 四半期セキュリティ評価
- [ ] 年次ペネトレーションテスト
- [ ] セキュリティ対応チームの訓練・演習

## コンプライアンス・監査 (モノレポ対応)

### 法的要件への対応

#### 該当法規制・準拠基準
```typescript
// shared/types/compliance.ts
export interface ComplianceRequirements {
  // 日本国内法
  personalInfoProtectionLaw: {
    applicable: boolean;
    requirements: string[];
    implementation: ComplianceImplementation[];
  };

  // 国際法・規制
  gdpr: {
    applicable: boolean; // EU居住者が利用する場合
    requirements: string[];
    implementation: ComplianceImplementation[];
  };

  coppa: {
    applicable: boolean; // 13歳未満が利用する場合
    requirements: string[];
    implementation: ComplianceImplementation[];
  };

  // 業界標準
  iso27001: {
    target: boolean;
    implementation: ComplianceImplementation[];
  };
}

export const complianceRequirements: ComplianceRequirements = {
  personalInfoProtectionLaw: {
    applicable: true,
    requirements: [
      '個人情報の適切な取得・利用・保存',
      '本人同意の取得・管理',
      '個人情報の安全管理措置',
      '第三者提供の制限',
      '個人情報の開示・訂正・削除対応',
      '個人情報取扱い状況の記録・報告'
    ],
    implementation: [
      {
        requirement: '個人情報の適切な取得・利用・保存',
        frontend: 'プライバシーポリシー表示・同意取得UI',
        backend: 'データ最小化・目的外利用防止ロジック',
        status: 'implemented'
      },
      {
        requirement: '本人同意の取得・管理',
        frontend: '同意管理UI・同意撤回機能',
        backend: '同意記録管理・同意状態検証',
        status: 'implemented'
      },
      {
        requirement: '個人情報の安全管理措置',
        frontend: 'クライアント暗号化・セキュアな保存',
        backend: 'サーバー暗号化・アクセス制御・監査ログ',
        status: 'implemented'
      }
    ]
  },

  gdpr: {
    applicable: true, // 将来的なEU展開を想定
    requirements: [
      'データポータビリティ権の実装',
      '忘れられる権利（削除権）の実装',
      'プライバシー・バイ・デザイン',
      'データ保護影響評価の実施',
      '72時間以内のデータ侵害通知',
      'データ保護責任者の設置（該当時）'
    ],
    implementation: [
      {
        requirement: 'データポータビリティ権',
        frontend: 'データエクスポート機能UI',
        backend: 'データエクスポートAPI・形式変換',
        status: 'planned'
      },
      {
        requirement: '忘れられる権利',
        frontend: 'アカウント削除・データ削除UI',
        backend: '完全データ削除・匿名化処理',
        status: 'implemented'
      }
    ]
  },

  coppa: {
    applicable: true, // 子供向けアプリのため
    requirements: [
      '13歳未満からの個人情報収集制限',
      '保護者同意の事前取得',
      '収集情報の最小化',
      '第三者への情報提供禁止',
      '保護者のアクセス・削除権保障'
    ],
    implementation: [
      {
        requirement: '13歳未満からの個人情報収集制限',
        frontend: '年齢確認UI・制限された情報入力',
        backend: '年齢ベース収集制限・親権者確認',
        status: 'implemented'
      }
    ]
  },

  iso27001: {
    target: true,
    implementation: [
      {
        requirement: '情報セキュリティマネジメントシステム',
        frontend: 'セキュリティ設定・監視',
        backend: 'セキュリティポリシー実装・監査',
        status: 'in_progress'
      }
    ]
  }
};
```

#### 監査対応・定期チェック
```typescript
// backend/functions/src/compliance/auditManager.ts
export class ComplianceAuditManager {
  private static readonly AUDIT_SCHEDULE = {
    // 定期監査
    annual: {
      securityAudit: 'セキュリティ監査・ペネトレーションテスト',
      complianceReview: 'コンプライアンス適合性レビュー',
      riskAssessment: 'リスクアセスメント・対策見直し'
    },

    quarterly: {
      accessLogReview: 'アクセスログ・権限レビュー',
      dataRetentionReview: 'データ保存期間・削除ポリシー確認',
      incidentReview: 'インシデント対応・改善点検討'
    },

    monthly: {
      securityConfigReview: 'セキュリティ設定・ルール確認',
      backupVerification: 'バックアップ・復旧テスト',
      userAccessReview: 'ユーザーアクセス権限レビュー'
    },

    weekly: {
      securityAlertReview: 'セキュリティアラート・異常検知確認',
      systemHealthCheck: 'システム健全性チェック',
      dataIntegrityCheck: 'データ整合性確認'
    }
  };

  // GDPR準拠データ侵害通知
  static async handleDataBreach(
    breachDetails: DataBreachDetails
  ): Promise<void> {
    const breach = await this.recordDataBreach(breachDetails);

    // 72時間以内の当局通知義務（GDPR）
    if (this.requiresRegulatoryNotification(breach)) {
      await this.scheduleRegulatoryNotification(breach, 72 * 60 * 60 * 1000);
    }

    // 影響を受けた個人への通知
    if (this.requiresUserNotification(breach)) {
      await this.notifyAffectedUsers(breach);
    }

    // データ保護当局への報告書作成
    if (breach.severity === 'high' || breach.scope === 'wide') {
      await this.generateRegulatoryReport(breach);
    }
  }

  // 定期監査レポート生成
  static async generateComplianceReport(
    period: 'monthly' | 'quarterly' | 'annual'
  ): Promise<ComplianceReport> {
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      complianceStatus: await this.assessComplianceStatus(),
      securityMetrics: await this.collectSecurityMetrics(),
      auditFindings: await this.getAuditFindings(period),
      riskAssessment: await this.conductRiskAssessment(),
      recommendations: await this.generateRecommendations(),
      actionItems: await this.getActionItems()
    };

    // レポート保存・配布
    await this.storeComplianceReport(report);
    await this.distributeReport(report);

    return report;
  }

  // データ主体の権利対応
  static async handleDataSubjectRequest(
    requestType: 'access' | 'rectification' | 'erasure' | 'portability',
    requestDetails: DataSubjectRequestDetails
  ): Promise<DataSubjectResponse> {
    // リクエスト記録
    const request = await this.recordDataSubjectRequest(requestType, requestDetails);

    // 30日以内の対応義務（GDPR）
    const responseDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    switch (requestType) {
      case 'access':
        return await this.provideDataAccess(request);
      case 'rectification':
        return await this.rectifyPersonalData(request);
      case 'erasure':
        return await this.erasePersonalData(request);
      case 'portability':
        return await this.provideDataPortability(request);
    }
  }
}

interface ComplianceImplementation {
  requirement: string;
  frontend: string;
  backend: string;
  status: 'planned' | 'in_progress' | 'implemented' | 'verified';
}

interface DataBreachDetails {
  detectedAt: string;
  breachType: 'confidentiality' | 'integrity' | 'availability';
  affectedDataTypes: string[];
  estimatedAffectedUsers: number;
  severity: 'low' | 'medium' | 'high';
  scope: 'narrow' | 'wide';
  containmentStatus: 'contained' | 'ongoing';
}
```

#### 継続的コンプライアンス監視
- [ ] **日次**: セキュリティログ自動監視・アラート
- [ ] **週次**: セキュリティアラート・異常検知確認
- [ ] **月次**: セキュリティ設定・ユーザーアクセス権限レビュー
- [ ] **四半期**: アクセスログ・データ保存期間・インシデント対応レビュー
- [ ] **年次**: セキュリティ監査・コンプライアンス適合性レビュー・リスクアセスメント
- [ ] **随時**: ペネトレーションテスト・脆弱性診断・セキュリティ教育
- [ ] **緊急時**: データ侵害通知・インシデント対応・規制当局報告