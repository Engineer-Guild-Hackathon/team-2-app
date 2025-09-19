import React from 'react';
import { useTranslation } from '../../i18n/i18nContext';
import { SkipLink } from '../ui/SkipLink';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { useAnnouncement } from '../../hooks/useAnnouncement';

interface RecommendationLayoutProps {
  children: React.ReactNode;
}

export function RecommendationLayout({ children }: RecommendationLayoutProps) {
  const { t } = useTranslation();
  useAnnouncement(); // Initialize announcement service

  return (
    <div className="min-h-screen bg-gray-50">
      {/* スキップリンク */}
      <SkipLink targetId="main-content" />

      {/* オフライン表示 */}
      <OfflineIndicator />


      {/* メインコンテンツ */}
      <main id="main-content" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>
              © 2024 学習サポートApp. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button
                type="button"
                className="hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                プライバシーポリシー
              </button>
              <button
                type="button"
                className="hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                利用規約
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}