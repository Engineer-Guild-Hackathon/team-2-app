import React, { useState } from 'react';
import { FilterOptions, RecommendationCategory } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { useFocusManagement } from '../../../hooks/useFocusManagement';
import { useAnnouncement } from '../../../hooks/useAnnouncement';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  availableTags: string[];
  availableAccessibility: string[];
}

const categoryOptions: { key: RecommendationCategory; emoji: string }[] = [
  { key: 'park', emoji: '🏞️' },
  { key: 'museum', emoji: '🏛️' },
  { key: 'library', emoji: '📚' },
  { key: 'event', emoji: '🎪' },
  { key: 'book', emoji: '📖' }
];

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableTags,
  availableAccessibility
}: FilterDrawerProps) {
  const { t } = useTranslation();
  const { announce } = useAnnouncement();
  const { containerRef } = useFocusManagement(isOpen, {
    returnFocusOnCleanup: true,
    trapFocus: true
  });

  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleCategoryToggle = (category: RecommendationCategory) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePriceToggle = (type: 'free' | 'paid') => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: !prev.priceRange[type]
      }
    }));
  };

  const handleAccessibilityToggle = (accessibility: string) => {
    setLocalFilters(prev => ({
      ...prev,
      accessibility: prev.accessibility.includes(accessibility)
        ? prev.accessibility.filter(a => a !== accessibility)
        : [...prev.accessibility, accessibility]
    }));
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleRadiusChange = (radius: number) => {
    setLocalFilters(prev => ({ ...prev, radius }));
  };

  const handleAgeRangeChange = (type: 'min' | 'max', value: number | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [type]: value
      }
    }));
  };

  const handleOpenNowToggle = () => {
    setLocalFilters(prev => ({ ...prev, openNow: !prev.openNow }));
  };

  const handleClearAll = () => {
    const defaultFilters: FilterOptions = {
      categories: [],
      priceRange: {},
      accessibility: [],
      radius: 10,
      openNow: false,
      ageRange: {},
      tags: []
    };
    setLocalFilters(defaultFilters);
    announce(t('filter.clearedAll'), 'polite');
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    announce(t('filter.applied'), 'polite');
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.categories.length > 0) count++;
    if (localFilters.priceRange.free || localFilters.priceRange.paid) count++;
    if (localFilters.accessibility.length > 0) count++;
    if (localFilters.radius !== 10) count++;
    if (localFilters.openNow) count++;
    if (localFilters.ageRange.min || localFilters.ageRange.max) count++;
    if (localFilters.tags.length > 0) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('filter.title')}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
      aria-describedby="filter-description"
    >
      <div className="space-y-6">
        <p id="filter-description" className="text-gray-600 text-sm">
          {t('filter.description')}
        </p>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('filter.categories')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryOptions.map(({ key, emoji }) => {
              const isSelected = localFilters.categories.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryToggle(key)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-pressed={isSelected}
                  role="checkbox"
                >
                  <span role="img" aria-hidden="true">{emoji}</span>
                  <span className="text-sm font-medium">
                    {t(`categories.${key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('filter.price')}
          </h3>
          <div className="flex space-x-4">
            {['free', 'paid'].map((type) => {
              const isSelected = localFilters.priceRange[type as 'free' | 'paid'];
              return (
                <button
                  key={type}
                  onClick={() => handlePriceToggle(type as 'free' | 'paid')}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-pressed={isSelected}
                  role="checkbox"
                >
                  <span className="text-sm font-medium">
                    {t(`filter.${type}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('filter.distance')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {localFilters.radius}km {t('filter.radius')}
              </span>
              <span className="text-sm text-gray-500">
                1km - 50km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={localFilters.radius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              aria-label={t('filter.radiusSlider')}
            />
            <div className="flex space-x-2">
              {[5, 10, 20].map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleRadiusChange(radius)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600"
                >
                  {radius}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Age Range */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t('filter.ageRange')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age-min" className="block text-sm font-medium text-gray-700 mb-1">
                {t('filter.ageMin')}
              </label>
              <input
                id="age-min"
                type="number"
                min="0"
                max="18"
                value={localFilters.ageRange.min || ''}
                onChange={(e) => handleAgeRangeChange('min', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="age-max" className="block text-sm font-medium text-gray-700 mb-1">
                {t('filter.ageMax')}
              </label>
              <input
                id="age-max"
                type="number"
                min="0"
                max="18"
                value={localFilters.ageRange.max || ''}
                onChange={(e) => handleAgeRangeChange('max', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="18"
              />
            </div>
          </div>
        </div>

        {/* Open Now */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={localFilters.openNow}
              onChange={handleOpenNowToggle}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('filter.openNow')}
            </span>
          </label>
        </div>

        {/* Accessibility */}
        {availableAccessibility.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('filter.accessibility')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableAccessibility.map((accessibility) => {
                const isSelected = localFilters.accessibility.includes(accessibility);
                return (
                  <button
                    key={accessibility}
                    onClick={() => handleAccessibilityToggle(accessibility)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                    aria-pressed={isSelected}
                    role="checkbox"
                  >
                    <span className="mr-1">♿</span>
                    {accessibility}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t('filter.tags')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.slice(0, 20).map((tag) => {
                const isSelected = localFilters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    aria-pressed={isSelected}
                    role="checkbox"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={getActiveFilterCount() === 0}
            >
              {t('filter.clearAll')}
            </Button>
            <span className="text-sm text-gray-500">
              {getActiveFilterCount()} {t('filter.filtersActive')}
            </span>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleApply}>
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}