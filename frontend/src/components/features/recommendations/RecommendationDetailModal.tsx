import React, { useState, useEffect } from 'react';
import { RecommendationDetail, RecommendationMode } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { useFocusManagement } from '../../../hooks/useFocusManagement';
import { Container } from '../../../infrastructure/container';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface RecommendationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationId: string | null;
  mode: RecommendationMode;
}

export function RecommendationDetailModal({
  isOpen,
  onClose,
  recommendationId,
  mode
}: RecommendationDetailModalProps) {
  const { t } = useTranslation();
  const { containerRef } = useFocusManagement(isOpen, {
    returnFocusOnCleanup: true,
    trapFocus: true
  });
  const [detail, setDetail] = useState<RecommendationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'family'>('overview');

  const container = Container.getInstance();
  const aiRecommendationService = container.getAIRecommendationService();

  useEffect(() => {
    if (isOpen && recommendationId) {
      loadDetail();
    }
  }, [isOpen, recommendationId]);

  const loadDetail = async () => {
    if (!recommendationId) return;

    try {
      setLoading(true);
      setError(null);
      const detailData = await aiRecommendationService.getRecommendationDetail(recommendationId);
      setDetail(detailData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.general'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = () => {
    if (!detail?.location) return;

    const { lat, lng } = detail.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail?.title || '詳細情報'}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
      aria-describedby="modal-description"
    >
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-900">
                {t('error.general')}
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={loadDetail} size="sm">
              {t('common.retry')}
            </Button>
          </div>
        </div>
      )}

      {detail && (
        <div className="space-y-6">
          {/* Gallery */}
          {detail.gallery && detail.gallery.length > 0 && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={detail.gallery[0]}
                alt={`${detail.title} ${t('detail.gallery')}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {detail.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {detail.description}
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="詳細タブ">
              {[
                { key: 'overview', label: '概要', icon: '📍' },
                { key: 'activities', label: 'おすすめ活動', icon: '🎯' },
                ...(mode === 'family' ? [{ key: 'family', label: '家族向け', icon: '👨‍👩‍👧‍👦' }] : [])
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  role="tab"
                  aria-selected={activeTab === key}
                >
                  <span role="img" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Location */}
                {detail.location && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {t('detail.location')}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 font-medium mb-2">
                        {detail.location.address}
                      </p>
                      {detail.location.access && (
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">{t('detail.access')}:</span> {detail.location.access}
                        </p>
                      )}
                      <div className="mt-3">
                        <Button onClick={handleDirections} size="sm">
                          {t('detail.directions')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Links */}
                {detail.links && detail.links.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      関連リンク
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-blue-600">🔗</span>
                          <span className="text-sm font-medium text-gray-900">{link.label}</span>
                          <span className="text-gray-400 ml-auto">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('detail.suggestedActivities')}
                </h3>
                {detail.suggestedActivities && detail.suggestedActivities.length > 0 ? (
                  <ul className="space-y-3">
                    {detail.suggestedActivities.map((activity, index) => (
                      <li key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 mt-0.5">🎯</span>
                        <span className="text-gray-900">{activity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">
                    おすすめの活動情報はまだ準備中です。
                  </p>
                )}
              </div>
            )}

            {activeTab === 'family' && mode === 'family' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('family.parentTips')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        {t('family.conversationStarters')}
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• 「どんな発見があったかな？」</li>
                        <li>• 「一番興味深かったことは？」</li>
                        <li>• 「次はどこを見たい？」</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-2">
                        {t('family.safetyNotes')}
                      </h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• お子様から目を離さないように</li>
                        <li>• 手洗い・消毒の徹底</li>
                        <li>• 混雑時は特に注意</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {t('family.whatToBring')}
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 水筒・飲み物</li>
                        <li>• 筆記用具（記録用）</li>
                        <li>• カメラ・スマートフォン</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">
                        {t('family.learningOpportunities')}
                      </h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• 観察力を育てる</li>
                        <li>• 疑問を持つ習慣づけ</li>
                        <li>• 体験を言葉にする練習</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Related Items */}
          {(detail.relatedBooks?.length > 0 || detail.relatedPlaces?.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('detail.relatedItems')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.relatedBooks?.map((bookId, index) => (
                  <Badge key={`book-${index}`} variant="info" className="text-xs">
                    📚 関連書籍 #{bookId}
                  </Badge>
                ))}
                {detail.relatedPlaces?.map((placeId, index) => (
                  <Badge key={`place-${index}`} variant="info" className="text-xs">
                    📍 関連スポット #{placeId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}