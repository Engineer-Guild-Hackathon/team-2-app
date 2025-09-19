import React from 'react';
import { useTranslation } from '../../i18n/i18nContext';

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children, className = '' }: SkipLinkProps) {
  const { t } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        absolute top-0 left-0 z-50
        transform -translate-y-full
        focus:translate-y-0
        bg-blue-600 text-white
        px-4 py-2 rounded-b-md
        font-medium text-sm
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-300
        ${className}
      `}
      tabIndex={0}
    >
      {children || t('a11y.skipToContent')}
    </a>
  );
}