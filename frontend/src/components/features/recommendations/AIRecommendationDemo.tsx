import React, { useState } from 'react';
import { Recommendation } from '../../../types/recommendation';
import { I18nProvider } from '../../../i18n/i18nContext';
import { RecommendationsHome } from './RecommendationsHome';
import { RecommendationDetailModal } from './RecommendationDetailModal';

export function AIRecommendationDemo() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleRecommendationClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation.id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedRecommendation(null);
  };

  return (
    <I18nProvider>
      <div className="min-h-screen bg-gray-50">
        <RecommendationsHome onRecommendationClick={handleRecommendationClick} />

        <RecommendationDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          recommendationId={selectedRecommendation}
          mode="learner"
        />
      </div>
    </I18nProvider>
  );
}