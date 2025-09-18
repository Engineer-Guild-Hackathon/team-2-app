import { TokenStatus } from '../../types/share';

interface StatusBannerProps {
  status: TokenStatus;
  className?: string;
}

export function StatusBanner({ status, className = '' }: StatusBannerProps) {
  const getStatusConfig = (status: TokenStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: '✅',
          text: '有効な共有リンク',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'expired':
        return {
          icon: '⏰',
          text: '期限切れ',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'revoked':
        return {
          icon: '🚫',
          text: '無効化済み',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'exceeded':
        return {
          icon: '📊',
          text: 'アクセス上限到達',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: '❓',
          text: '不明な状態',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      role="status"
      aria-label={`共有リンクの状態: ${config.text}`}
    >
      <span className="mr-2" role="img" aria-hidden="true">
        {config.icon}
      </span>
      {config.text}
    </div>
  );
}