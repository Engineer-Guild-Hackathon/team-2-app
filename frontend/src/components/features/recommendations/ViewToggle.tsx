import React from 'react';
import { useTranslation } from '../../../i18n/i18nContext';
import Button from '../../ui/Button';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  mapEnabled?: boolean;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  mapEnabled = true,
  className = ''
}: ViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex bg-gray-100 p-1 rounded-lg ${className}`} role="tablist">
      <Button
        variant={currentView === 'list' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`flex items-center space-x-2 transition-all duration-200 ${
          currentView === 'list'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        role="tab"
        aria-selected={currentView === 'list'}
        aria-controls="content-panel"
        data-testid="view-toggle-list"
      >
        <span className="text-lg" role="img" aria-hidden="true">📋</span>
        <span className="text-sm font-medium">{t('common.list')}</span>
      </Button>

      <Button
        variant={currentView === 'map' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('map')}
        disabled={!mapEnabled}
        className={`flex items-center space-x-2 transition-all duration-200 ${
          currentView === 'map'
            ? 'bg-white shadow-sm text-gray-900'
            : mapEnabled
            ? 'text-gray-600 hover:text-gray-900'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        role="tab"
        aria-selected={currentView === 'map'}
        aria-controls="content-panel"
        data-testid="view-toggle-map"
      >
        <span className="text-lg" role="img" aria-hidden="true">🗺️</span>
        <span className="text-sm font-medium">{t('common.map')}</span>
      </Button>

      {!mapEnabled && (
        <div className="ml-2 flex items-center">
          <span
            className="text-xs text-gray-400"
            title="マップ機能は現在利用できません"
          >
            ⚠️
          </span>
        </div>
      )}
    </div>
  );
}