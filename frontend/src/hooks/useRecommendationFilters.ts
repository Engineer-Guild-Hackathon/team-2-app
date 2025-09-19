import { useState, useCallback, useEffect } from 'react';
import { FilterOptions, FilterState, Recommendation } from '../types/recommendation';

const defaultFilters: FilterOptions = {
  categories: [],
  priceRange: {},
  accessibility: [],
  radius: 10,
  openNow: false,
  ageRange: {},
  tags: []
};

export function useRecommendationFilters() {
  const [filterState, setFilterState] = useState<FilterState>({
    isOpen: false,
    options: defaultFilters,
    appliedFilters: defaultFilters
  });

  const openFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      isOpen: true,
      options: prev.appliedFilters
    }));
  }, []);

  const closeFilters = useCallback(() => {
    setFilterState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const applyFilters = useCallback((filters: FilterOptions) => {
    setFilterState(prev => ({
      ...prev,
      appliedFilters: filters,
      options: filters,
      isOpen: false
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      appliedFilters: defaultFilters,
      options: defaultFilters
    }));
  }, []);

  const filterRecommendations = useCallback((recommendations: Recommendation[]) => {
    const { appliedFilters } = filterState;

    return recommendations.filter(recommendation => {
      // Category filter
      if (appliedFilters.categories.length > 0) {
        // Since we don't have category on Recommendation, we'll use tags as a proxy
        const hasMatchingCategory = appliedFilters.categories.some(category =>
          recommendation.tags.some(tag => tag.toLowerCase().includes(category))
        );
        if (!hasMatchingCategory) return false;
      }

      // Price filter
      if (appliedFilters.priceRange.free || appliedFilters.priceRange.paid) {
        const isFree = recommendation.price === 'free' || !recommendation.price;
        const isPaid = recommendation.price && recommendation.price !== 'free';

        if (appliedFilters.priceRange.free && !isFree) return false;
        if (appliedFilters.priceRange.paid && !isPaid) return false;
        if (!appliedFilters.priceRange.free && isFree && appliedFilters.priceRange.paid) return false;
        if (!appliedFilters.priceRange.paid && isPaid && appliedFilters.priceRange.free) return false;
      }

      // Distance filter
      if (recommendation.distanceKm !== undefined && recommendation.distanceKm > appliedFilters.radius) {
        return false;
      }

      // Accessibility filter
      if (appliedFilters.accessibility.length > 0) {
        const hasMatchingAccessibility = appliedFilters.accessibility.some(accessibility =>
          recommendation.accessibility.includes(accessibility)
        );
        if (!hasMatchingAccessibility) return false;
      }

      // Tags filter
      if (appliedFilters.tags.length > 0) {
        const hasMatchingTag = appliedFilters.tags.some(tag =>
          recommendation.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Score filter (we could add minimum score filtering)
      // if (appliedFilters.minScore && recommendation.score < appliedFilters.minScore) {
      //   return false;
      // }

      return true;
    });
  }, [filterState]);

  const getActiveFilterCount = useCallback(() => {
    const { appliedFilters } = filterState;
    let count = 0;

    if (appliedFilters.categories.length > 0) count++;
    if (appliedFilters.priceRange.free || appliedFilters.priceRange.paid) count++;
    if (appliedFilters.accessibility.length > 0) count++;
    if (appliedFilters.radius !== 10) count++;
    if (appliedFilters.openNow) count++;
    if (appliedFilters.ageRange.min || appliedFilters.ageRange.max) count++;
    if (appliedFilters.tags.length > 0) count++;

    return count;
  }, [filterState.appliedFilters]);

  const getAvailableTags = useCallback((recommendations: Recommendation[]) => {
    const allTags = recommendations.flatMap(rec => rec.tags);
    return Array.from(new Set(allTags)).sort();
  }, []);

  const getAvailableAccessibility = useCallback((recommendations: Recommendation[]) => {
    const allAccessibility = recommendations.flatMap(rec => rec.accessibility);
    return Array.from(new Set(allAccessibility)).sort();
  }, []);

  const hasActiveFilters = getActiveFilterCount() > 0;

  return {
    filterState,
    openFilters,
    closeFilters,
    applyFilters,
    clearFilters,
    filterRecommendations,
    getActiveFilterCount,
    getAvailableTags,
    getAvailableAccessibility,
    hasActiveFilters
  };
}