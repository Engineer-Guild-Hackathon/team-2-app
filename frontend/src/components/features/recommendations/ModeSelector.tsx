import React from 'react';
import { RecommendationMode } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import Button from '../../ui/Button';

interface ModeSelectorProps {
  selectedMode: RecommendationMode;
  onModeChange: (mode: RecommendationMode) => void;
  className?: string;
}

export function ModeSelector({
  selectedMode,
  onModeChange,
  className = ''
}: ModeSelectorProps) {
  const { t } = useTranslation();

  const modes: Array<{ key: RecommendationMode; icon: string; description: string }> = [
    {
      key: 'learner',
      icon: '🎓',
      description: '個人の学習に最適化されたおすすめ'
    },
    {
      key: 'family',
      icon: '👨‍👩‍👧‍👦',
      description: '家族での活動に最適化されたおすすめ'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {t('recommendations.modes.learner')} / {t('recommendations.modes.family')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modes.map(({ key, icon, description }) => {
            const isSelected = selectedMode === key;

            return (
              <button
                key={key}
                onClick={() => onModeChange(key)}
                className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                role="radio"
                aria-checked={isSelected}
                aria-describedby={`mode-description-${key}`}
                data-testid={`mode-selector-${key}`}
              >
                <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {t(`recommendations.modes.${key}`)}
                    </span>
                    {isSelected && (
                      <span
                        className="text-blue-600"
                        role="img"
                        aria-label="選択済み"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p
                    id={`mode-description-${key}`}
                    className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}