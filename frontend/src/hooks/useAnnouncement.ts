import { useCallback, useRef } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

export function useAnnouncement() {
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);

  // アナウンス用のlive regionを作成
  const createLiveRegion = useCallback((priority: AnnouncementPriority) => {
    const existingRegion = document.getElementById(`live-region-${priority}`);
    if (existingRegion) return existingRegion as HTMLDivElement;

    const region = document.createElement('div');
    region.id = `live-region-${priority}`;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only'; // スクリーンリーダー専用（視覚的には非表示）
    region.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    document.body.appendChild(region);

    if (priority === 'polite') {
      politeRegionRef.current = region;
    } else {
      assertiveRegionRef.current = region;
    }

    return region;
  }, []);

  // スクリーンリーダーにメッセージをアナウンス
  const announce = useCallback((
    message: string,
    priority: AnnouncementPriority = 'polite'
  ) => {
    const region = createLiveRegion(priority);

    // 既存のメッセージをクリア
    region.textContent = '';

    // 少し遅延してメッセージを設定（スクリーンリーダーが確実に読み上げるため）
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // 一定時間後にメッセージをクリア
    setTimeout(() => {
      region.textContent = '';
    }, 5000);
  }, [createLiveRegion]);

  // ページの状態変更をアナウンス
  const announcePageChange = useCallback((pageTitle: string) => {
    announce(`ページが変更されました: ${pageTitle}`, 'polite');
  }, [announce]);

  // 検索結果の変更をアナウンス
  const announceSearchResults = useCallback((count: number, query?: string) => {
    const message = query
      ? `${query}の検索結果: ${count}件が見つかりました`
      : `検索結果: ${count}件が見つかりました`;
    announce(message, 'polite');
  }, [announce]);

  // エラーメッセージをアナウンス
  const announceError = useCallback((errorMessage: string) => {
    announce(`エラー: ${errorMessage}`, 'assertive');
  }, [announce]);

  // 成功メッセージをアナウンス
  const announceSuccess = useCallback((successMessage: string) => {
    announce(`完了: ${successMessage}`, 'polite');
  }, [announce]);

  // ローディング状態をアナウンス
  const announceLoading = useCallback((action: string) => {
    announce(`${action}を読み込み中です`, 'polite');
  }, [announce]);

  return {
    announce,
    announcePageChange,
    announceSearchResults,
    announceError,
    announceSuccess,
    announceLoading
  };
}