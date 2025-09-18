import { useState } from 'react';
import { Artifact } from '../../types/share';

interface ArtifactCardProps {
  artifact: Artifact;
  onView?: (artifact: Artifact) => void;
}

export function ArtifactCard({ artifact, onView }: ArtifactCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const handleClick = () => {
    if (onView) {
      onView(artifact);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`成果物: ${artifact.caption}`}
    >
      <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {artifact.thumb_url && !imageError ? (
          <img
            src={artifact.thumb_url}
            alt={artifact.caption}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2" role="img" aria-label={`${artifact.type}のアイコン`}>
              {getTypeIcon(artifact.type)}
            </span>
            <span className="text-sm font-medium">
              {artifact.type === 'photo' && 'フォト'}
              {artifact.type === 'video' && 'ビデオ'}
              {artifact.type === 'audio' && 'オーディオ'}
              {artifact.type === 'text' && 'テキスト'}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h4 className="font-medium text-gray-800 line-clamp-2 leading-snug">
          {artifact.caption}
        </h4>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={artifact.date}>
            {formatDate(artifact.date)}
          </time>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {getTypeIcon(artifact.type)} {artifact.type}
          </span>
        </div>

        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {artifact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {artifact.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{artifact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}