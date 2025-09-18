import { Artifact } from '../../types/share';
import { ArtifactCard } from './ArtifactCard';

interface ArtifactGridProps {
  artifacts: Artifact[];
  onArtifactView?: (artifact: Artifact) => void;
}

export function ArtifactGrid({ artifacts, onArtifactView }: ArtifactGridProps) {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <span className="text-6xl" role="img" aria-label="空のフォルダ">
            📁
          </span>
        </div>
        <p className="text-gray-500">
          成果物が見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          onView={onArtifactView}
        />
      ))}
    </div>
  );
}