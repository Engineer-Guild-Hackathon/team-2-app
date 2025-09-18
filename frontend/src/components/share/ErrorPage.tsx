import { ShareError } from '../../types/share';

interface ErrorPageProps {
  error: ShareError;
}

export function ErrorPage({ error }: ErrorPageProps) {
  const getErrorConfig = (error: ShareError) => {
    switch (error.code) {
      case 404:
        return {
          icon: '🔍',
          title: 'ページが見つかりません',
          description: '共有リンクが見つからないか、有効期限が切れている可能性があります。',
          suggestions: [
            'リンクが正しいか確認してください',
            '保護者の方に新しい共有リンクを依頼してください'
          ]
        };
      case 403:
        return {
          icon: '🚫',
          title: 'アクセスが拒否されました',
          description: '共有リンクが無効化されています。',
          suggestions: [
            '保護者の方に共有設定を確認してもらってください',
            '新しい共有リンクを依頼してください'
          ]
        };
      case 410:
        return {
          icon: '📊',
          title: 'アクセス上限に達しました',
          description: 'この共有リンクは既に上限回数アクセスされています。',
          suggestions: [
            '保護者の方に新しい共有リンクを依頼してください'
          ]
        };
      default:
        return {
          icon: '⚠️',
          title: 'エラーが発生しました',
          description: error.message || '予期しないエラーが発生しました。',
          suggestions: [
            'しばらく待ってから再度お試しください',
            '問題が続く場合は保護者の方にお知らせください'
          ]
        };
    }
  };

  const config = getErrorConfig(error);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <span className="text-6xl" role="img" aria-label="エラーアイコン">
            {config.icon}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {config.title}
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {config.description}
        </p>

        <div className="space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              対処方法:
            </h2>
            <ul className="text-sm text-gray-600 space-y-1">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            戻る
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            エラーコード: {error.code}
          </p>
        </div>
      </div>
    </div>
  );
}