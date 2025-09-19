import React, { useState, useRef, useEffect } from 'react';

interface WhyTooltipProps {
  why: string[];
  className?: string;
  children: React.ReactNode;
}

export function WhyTooltip({ why, className = '', children }: WhyTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (triggerRef.current && why.length > 0) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = 120; // 推定高さ
      const tooltipWidth = 200; // 推定幅

      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

      // 画面外に出る場合の調整
      if (left < 8) {
        left = 8;
      } else if (left + tooltipWidth > window.innerWidth - 8) {
        left = window.innerWidth - tooltipWidth - 8;
      }

      // 上部に表示する場合
      if (top + tooltipHeight > window.innerHeight) {
        top = rect.top + window.scrollY - tooltipHeight - 8;
      }

      setPosition({ top, left });
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isVisible]);

  if (why.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={showTooltip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showTooltip();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="なぜおすすめなのかを表示"
        aria-expanded={isVisible}
        aria-describedby={isVisible ? 'why-tooltip' : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <>
          {/* オーバーレイ（モバイル用） */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={hideTooltip}
            aria-hidden="true"
          />

          {/* ツールチップ */}
          <div
            ref={tooltipRef}
            id="why-tooltip"
            className="fixed z-50 max-w-xs w-auto"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            role="tooltip"
          >
            <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 relative">
              {/* 矢印 */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />

              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-yellow-300 flex items-center">
                  <span className="mr-1">💡</span>
                  なぜおすすめ？
                </h4>
                <button
                  onClick={hideTooltip}
                  className="text-gray-400 hover:text-white transition-colors ml-2"
                  aria-label="閉じる"
                >
                  ✕
                </button>
              </div>

              {/* 理由一覧 */}
              <ul className="space-y-1">
                {why.map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-100">{reason}</span>
                  </li>
                ))}
              </ul>

              {/* フッター */}
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  🤖 行動パターンから分析
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ショートハンド版（理由ボタン専用）
interface WhyButtonProps {
  why: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle';
  className?: string;
}

export function WhyButton({ why, size = 'sm', variant = 'default', className = '' }: WhyButtonProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  };

  const variantClasses = {
    default: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300',
    subtle: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
  };

  return (
    <WhyTooltip why={why} className={className}>
      <button
        className={`
          inline-flex items-center justify-center rounded-full font-medium
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${sizeClasses[size]} ${variantClasses[variant]}
        `}
        aria-label={`理由を表示: ${why.length}個の理由があります`}
      >
        ?
      </button>
    </WhyTooltip>
  );
}