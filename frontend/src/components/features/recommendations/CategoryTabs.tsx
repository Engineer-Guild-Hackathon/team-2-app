import React from 'react';
import { RecommendationCategory } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import Button from '../../ui/Button';

interface CategoryTabsProps {
  selectedCategory: RecommendationCategory | null;
  onCategoryChange: (category: RecommendationCategory | null) => void;
  className?: string;
}

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
  className = ''
}: CategoryTabsProps) {
  const { t } = useTranslation();

  const categories: Array<{ key: RecommendationCategory | null; icon: string }> = [
    { key: null, icon: '🏠' },
    { key: 'park', icon: '🌳' },
    { key: 'museum', icon: '🏛️' },
    { key: 'library', icon: '📚' },
    { key: 'book', icon: '📖' },
    { key: 'event', icon: '🎪' }
  ];

  return (
    <div className={`flex overflow-x-auto scrollbar-hide ${className}`} role="tablist">
      <div className="flex space-x-2 p-1">
        {categories.map(({ key, icon }) => {
          const isSelected = selectedCategory === key;
          const categoryKey = key || 'all';

          return (
            <Button
              key={categoryKey}
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(key)}
              className={`flex items-center space-x-2 whitespace-nowrap min-w-fit transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`category-panel-${categoryKey}`}
              data-testid={`category-tab-${categoryKey}`}
            >
              <span className="text-lg" role="img" aria-hidden="true">
                {icon}
              </span>
              <span className="text-sm font-medium">
                {t(`recommendations.categories.${categoryKey}`)}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}