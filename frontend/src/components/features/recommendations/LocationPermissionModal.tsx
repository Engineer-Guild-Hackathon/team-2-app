import React, { useState } from 'react';
import { useTranslation } from '../../../i18n/i18nContext';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
  isRequesting?: boolean;
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
  isRequesting = false
}: LocationPermissionModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'explanation' | 'manual'>('explanation');

  const handleAllowLocation = () => {
    onPermissionGranted();
  };

  const handleDenyLocation = () => {
    setStep('manual');
  };

  const handleManualSetup = () => {
    onPermissionDenied();
    onClose();
  };

  const handleSkip = () => {
    onPermissionDenied();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('location.permissionTitle')}
      className="max-w-md"
    >
      <div className="space-y-6">
        {step === 'explanation' && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl" role="img" aria-label="位置情報">📍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('location.permissionTitle')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('location.permissionMessage')}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                位置情報を使用する理由：
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 近くのおすすめスポットを表示</li>
                <li>• 距離に基づいた並び替え</li>
                <li>• より関連性の高い提案</li>
                <li>• アクセス情報の提供</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                プライバシーについて：
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 位置データはセッション内でのみ使用</li>
                <li>• 外部サーバーには保存されません</li>
                <li>• いつでも設定を変更可能</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleAllowLocation}
                disabled={isRequesting}
                className="w-full"
                data-testid="allow-location-button"
              >
                {isRequesting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('location.useCurrentLocation')
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDenyLocation}
                disabled={isRequesting}
                className="w-full"
              >
                {t('location.manualLocation')}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isRequesting}
                className="w-full text-gray-500"
              >
                今はスキップ
              </Button>
            </div>
          </>
        )}

        {step === 'manual' && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl" role="img" aria-label="手動設定">🗺️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('location.manualLocation')}
              </h3>
              <p className="text-sm text-gray-600">
                位置情報なしでも、手動で地域を設定してご利用いただけます。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="manual-location" className="block text-sm font-medium text-gray-700 mb-1">
                  お住まいの地域
                </label>
                <select
                  id="manual-location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="">地域を選択してください</option>
                  <option value="tokyo">東京都</option>
                  <option value="kanagawa">神奈川県</option>
                  <option value="chiba">千葉県</option>
                  <option value="saitama">埼玉県</option>
                  <option value="osaka">大阪府</option>
                  <option value="kyoto">京都府</option>
                  <option value="hyogo">兵庫県</option>
                  <option value="aichi">愛知県</option>
                  <option value="fukuoka">福岡県</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleManualSetup}
                  className="w-full"
                >
                  この地域で設定
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep('explanation')}
                  className="w-full"
                >
                  戻る
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}