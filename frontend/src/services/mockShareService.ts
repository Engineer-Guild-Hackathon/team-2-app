import { ShareResponse, ShareError } from '../types/share';
import { getShareData } from '../mocks/shareData';

export class MockShareService {
  static async resolveShare(token: string): Promise<ShareResponse | ShareError> {
    // 実際のAPIコールをシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!token) {
      return {
        error: 'invalid_token',
        code: 400,
        message: 'Token is required'
      };
    }

    const shareData = getShareData(token);

    if (!shareData) {
      return {
        error: 'not_found',
        code: 404,
        message: 'Share link not found or expired'
      };
    }

    // トークンステータスに応じてエラーを返す
    switch (shareData.token_status) {
      case 'expired':
        return {
          error: 'expired',
          code: 404,
          message: 'Share link has expired'
        };
      case 'revoked':
        return {
          error: 'revoked',
          code: 403,
          message: 'Share link has been revoked'
        };
      case 'exceeded':
        return {
          error: 'exceeded',
          code: 410,
          message: 'Share link access limit exceeded'
        };
      case 'active':
        return shareData;
      default:
        return {
          error: 'unknown_status',
          code: 500,
          message: 'Unknown token status'
        };
    }
  }
}