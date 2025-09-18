import { ShareResponse, ShareError } from '../types/share';
import { MockShareService } from './mockShareService';

export class ShareService {
  static async resolveShare(token: string): Promise<ShareResponse | ShareError> {
    // 開発環境ではモックサービスを使用
    if (import.meta.env.MODE === 'development') {
      return MockShareService.resolveShare(token);
    }

    // 本番環境ではAPIを呼び出し
    try {
      const response = await fetch(`/api/share/resolve?token=${encodeURIComponent(token)}`);

      if (!response.ok) {
        if (response.status === 404) {
          return { error: 'not_found', code: 404, message: 'Share link not found or expired' };
        }
        if (response.status === 403) {
          return { error: 'revoked', code: 403, message: 'Share link has been revoked' };
        }
        if (response.status === 410) {
          return { error: 'exceeded', code: 410, message: 'Share link access limit exceeded' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as ShareResponse;
    } catch (error) {
      console.error('Share resolve error:', error);
      return {
        error: 'network_error',
        code: 500,
        message: 'Failed to load share data. Please try again.'
      };
    }
  }
}