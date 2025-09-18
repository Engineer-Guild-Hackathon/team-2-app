import { useState } from 'react';
import { Artifact } from '../../types/share';

interface ArtifactModalProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtifactModal({ artifact, isOpen, onClose }: ArtifactModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !artifact) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return '📷';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'text':
        return '📝';
      default:
        return '📄';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800">
            成果物の詳細
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="モーダルを閉じる"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* メディア表示エリア */}
            <div className="flex justify-center">
              {artifact.type === 'photo' && artifact.thumb_url && !imageError ? (
                <img
                  src={artifact.thumb_url}
                  alt={artifact.caption}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
                  <span className="text-6xl mb-4" role="img" aria-label={`${artifact.type}のアイコン`}>
                    {getTypeIcon(artifact.type)}
                  </span>
                  <span className="text-lg font-medium text-gray-600">
                    {artifact.type === 'photo' && 'フォト'}
                    {artifact.type === 'video' && 'ビデオ'}
                    {artifact.type === 'audio' && 'オーディオ'}
                    {artifact.type === 'text' && 'テキスト'}
                  </span>
                </div>
              )}
            </div>

            {/* 詳細情報 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {artifact.caption}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">作成日時:</span>
                  <p className="mt-1 text-gray-800">
                    <time dateTime={artifact.date}>
                      {formatDate(artifact.date)}
                    </time>
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-600">種類:</span>
                  <p className="mt-1 text-gray-800">
                    {getTypeIcon(artifact.type)} {artifact.type}
                  </p>
                </div>
              </div>

              {artifact.tags && artifact.tags.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600 block mb-2">タグ:</span>
                  <div className="flex flex-wrap gap-2">
                    {artifact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}